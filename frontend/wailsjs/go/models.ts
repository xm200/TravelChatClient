export namespace main {
	
	export class Message {
	    sender: string;
	    destination: string;
	    body: string;
	    timestamp: string;
	
	    static createFrom(source: any = {}) {
	        return new Message(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.sender = source["sender"];
	        this.destination = source["destination"];
	        this.body = source["body"];
	        this.timestamp = source["timestamp"];
	    }
	}

}

export namespace websocket {
	
	export class Conn {
	
	
	    static createFrom(source: any = {}) {
	        return new Conn(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	
	    }
	}

}

