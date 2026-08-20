export interface Issue { 
    id: string;
    title: string; 
    description: string; 
    boardId: string; 
    sectionId: string; 
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