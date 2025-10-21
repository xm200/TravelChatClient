package main

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
)

type Config struct {
	BaseURL string
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
	ctx    context.Context
	token  string
	config Config
	chats  []string
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
		BaseURL: "http://127.0.0.1:8080",
	}
}

// Greet returns a greeting for the given name
func (a *App) Greet(name string) string {
	return fmt.Sprintf("Hello %s, It's show time!", name)
}

func (a *App) Login(username, password string) bool {
	loginreq := LoginRequest{username, password}
	data, _ := json.Marshal(loginreq)
	fmt.Println(string(data))
	req, _ := http.Post(a.config.BaseURL+"/api/login", "application/json", bytes.NewBuffer(data))
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
	chats, err := http.Post(a.config.BaseURL+"/api/getMemberships", "application/json", bytes.NewBuffer([]byte("{\"token\": \""+a.token+"\"}")))
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
}

// ConnectChat connecting ws://BASE_URL/ws?token={a.token}&chat={chatName} to listen and send messages
func (a *App) ConnectChat(name string) {}
