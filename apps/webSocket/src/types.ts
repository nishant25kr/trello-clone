export interface Issue {
    id:number,
    title: string, 
    section: string
}

export interface User{
    id: string,
    username: string,
    ws:WebSocket
}

export interface PayloadSchema{
    
}

export interface OutgoingMessage{
    type: string,
    payload: PayloadSchema
}