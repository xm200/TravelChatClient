package main

import (
	"bytes"
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"github.com/gorilla/websocket"
	"github.com/wailsapp/wails/v2/pkg/runtime"
	"io"
	"log"
	"net/http"
	"strings"
	"time"
)

// Config is some configurations of app specific to user
type Config struct {
	BaseURL string
}

type Message struct {
	Sender    string `json:"sender"`
	Dest      string `json:"destination"`
	Body      string `json:"body"`
	Timestamp string `json:"timestamp"`
}

type LoginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

type LoginResponse struct {
	Ok    bool   `json:"ok"`
	Err   string `json:"error"`
	Token string `json:"token"`
}

// App struct
type App struct {
	ctx               context.Context
	token             string
	username          string
	config            Config
	chats             []string
	activeConnections map[string]*websocket.Conn
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{}
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
	a.config = Config{
		BaseURL: "://127.0.0.1:8080",
	}
	a.activeConnections = make(map[string]*websocket.Conn)
}

func (a *App) Login(username, password string) bool {
	loginreq := LoginRequest{username, password}
	data, _ := json.Marshal(loginreq)
	fmt.Println(string(data))
	req, _ := http.Post("http"+a.config.BaseURL+"/api/login", "application/json", bytes.NewBuffer(data))
	if req.StatusCode != http.StatusOK {
		return false
	}
	data, _ = io.ReadAll(req.Body)
	var resp LoginResponse
	err := json.Unmarshal(data, &resp)
	if err != nil {
		log.Fatal(err)
	}
	a.token = resp.Token
	println(resp.Token)
	return true
}

func (a *App) GetMemberships() []string {
	type memberships struct {
		Members []string `json:"chats"`
	}
	chats, err := http.Post("http"+a.config.BaseURL+"/api/getMemberships", "application/json", bytes.NewBuffer([]byte("{\"token\": \""+a.token+"\"}")))
	if err != nil {
		log.Println(err, "1")
	}
	data, err := io.ReadAll(chats.Body)
	if err != nil {
		log.Println(err, "2")
	}
	m := new(memberships)
	err = json.Unmarshal(data, m)
	if err != nil {
		log.Println(err, "3", string(data))
	}
	a.chats = m.Members
	return m.Members
}

func (a *App) Logout() {
	a.token = ""
	a.DisconnectAll()
	a.chats = []string{}
	a.username = ""
	log.Printf("Logout completed. Token: %s, Username: %s, Active connections: %d",
		a.token, a.username, len(a.activeConnections))

	// Отправляем событие на фронтенд о выходе
	runtime.EventsEmit(a.ctx, "logout_completed")
}

// Connect connecting to a websocket ws://BASE_URL/ws?token={a.token}&chat={chatName} to listen and send messages
func (a *App) Connect(name string) string {
	if a.activeConnections[name] != nil {
		return "Already connected"
	} else {
		dialer := websocket.Dialer{}
		conn, _, err := dialer.Dial("ws"+a.config.BaseURL+"/ws?token="+a.token+"&chat="+name, nil)
		if err != nil {
			log.Println(err, "1")
		}
		a.activeConnections[name] = conn
		runtime.EventsEmit(a.ctx, "chat_connected", name)
		go a.ListenConn(conn, name)
		return "ok"
	}
}

func (a *App) ListenConn(conn *websocket.Conn, name string) {
	defer func() {
		// Восстанавливаемся при панике
		if r := recover(); r != nil {
			log.Printf("Recovered from panic in ListenConn for %s: %v", name, r)
		}

		// Удаляем из активных соединений, если еще там
		if a.activeConnections[name] == conn {
			delete(a.activeConnections, name)
			runtime.EventsEmit(a.ctx, "chat_disconnected", name)
			log.Printf("Listener stopped for chat: %s", name)
		}
	}()

	for {
		m := new(Message)
		err := conn.ReadJSON(m)
		if err != nil {
			// Проверяем, является ли ошибка нормальным закрытием соединения
			if websocket.IsUnexpectedCloseError(err, websocket.CloseNormalClosure, websocket.CloseGoingAway) {
				log.Printf("WebSocket read error for chat %s: %v", name, err)
			}
			break
		}

		if m != nil && m.Body != "" {
			runtime.EventsEmit(a.ctx, "message", m)
			log.Printf("Received message in chat %s: %s", name, m.Body)
		}
	}
}

func (a *App) Disconnect(name string) string {
	conn, exists := a.activeConnections[name]
	if !exists || conn == nil {
		return "Already disconnected"
	} else {
		err := conn.Close()
		if err != nil {
			log.Printf("Error closing connection for chat %s: %v", name, err)
			return "Error disconnecting"
		}

		// Удаляем из активных соединений
		delete(a.activeConnections, name)

		// Отправляем событие отключения
		runtime.EventsEmit(a.ctx, "chat_disconnected", name)

		log.Printf("Disconnected from chat: %s", name)
		return "ok"
	}
}

func (a *App) DisconnectAll() {
	log.Printf("Disconnecting all chats. Active connections: %d", len(a.activeConnections))

	// Создаем копию ключей, так как мапа будет меняться во время итерации
	chatNames := make([]string, 0, len(a.activeConnections))
	for name := range a.activeConnections {
		chatNames = append(chatNames, name)
	}

	// Закрываем все соединения
	for _, name := range chatNames {
		a.Disconnect(name)
	}

	log.Printf("All connections disconnected. Remaining: %d", len(a.activeConnections))
}

func (a *App) SendMessage(name, message string) bool {
	if name == "" || message == "" {
		return false
	}
	if a.username == "" {
		_ = a.DecodeName()
	}
	m := &Message{
		Sender:    a.username,
		Body:      message,
		Dest:      name,
		Timestamp: time.Now().String(),
	}
	data, err := json.Marshal(m)
	if err != nil {
		log.Println("Error while serializing message: ", err)
	}
	log.Println(string(data))
	err = a.activeConnections[name].WriteJSON(m)
	if err != nil {
		log.Println("Error while writing message: ", err)
		return false
	}
	log.Println("Message sent")
	return true
}

func (a *App) GetHistory(chat string) []Message {
	type RequestGetHistory struct {
		Token string `json:"token"`
		Name  string `json:"name"`
	}
	type ResponseGetHistory struct {
		History []Message `json:"history"`
	}
	req := &RequestGetHistory{Name: chat, Token: a.token}
	data, err := json.Marshal(req)
	if err != nil {
		log.Println("Error while serializing history: ", err)
		return []Message{}
	}
	resp, err := http.Post("http"+a.config.BaseURL+"/api/getChatHistory", "application/json", bytes.NewBuffer(data))
	if err != nil {
		log.Println(err, "1")
		return []Message{}
	}
	defer resp.Body.Close()
	var ans ResponseGetHistory
	data, _ = io.ReadAll(resp.Body)
	err = json.Unmarshal(data, &ans)
	if err != nil {
		log.Println(err, "2", string(data))
		return []Message{}
	}
	return ans.History
}

func (a *App) Fullscreen() error {
	runtime.WindowFullscreen(a.ctx)
	return nil
}

func (a *App) ExitFullscreen() error {
	runtime.WindowUnfullscreen(a.ctx)
	return nil
}

func (a *App) ToggleFullscreen() error {
	if runtime.WindowIsFullscreen(a.ctx) {
		runtime.WindowUnfullscreen(a.ctx)
	} else {
		runtime.WindowFullscreen(a.ctx)
	}
	return nil
}

// Дополнительные методы для управления окном
func (a *App) Minimize() error {
	runtime.WindowMinimise(a.ctx)
	log.Println("Decreasing window size")
	return nil
}

func (a *App) Maximize() error {
	runtime.WindowMaximise(a.ctx)
	log.Println("Increasing window size")
	return nil
}

func (a *App) Close() error {
	log.Println("Closed all connections")
	runtime.Quit(a.ctx)
	return nil
}

func (a *App) DecodeName() string {
	if a.token == "" {
		return "Unauthorized"
	} else {
		type Claims struct {
			Exp int64  `json:"exp"`
			Sub string `json:"sub"`
		}
		var claims Claims
		err := json.NewDecoder(base64.NewDecoder(base64.StdEncoding, bytes.NewBuffer([]byte(strings.Split(a.token, ".")[1])))).Decode(&claims)
		a.username = claims.Sub
		if err != nil {
			log.Println("Error while decoding claims: ", err)
			return "Error while decoding claims"
		}
		return claims.Sub
	}
}
