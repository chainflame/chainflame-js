import { MessageTypes } from "./message-types"
import { SOCKET_URL } from "../util/constants"
import WebSocket from 'ws'

export default class SocketManager {

    private readonly apiKey: string
    private webSocket: any | undefined

    constructor(apiKey: string) {
        this.apiKey = apiKey
    }

    public async connect() {
        return new Promise((resolve, reject) => {

            // Create the socket
            this.webSocket = new WebSocket(SOCKET_URL, ['token', this.apiKey])

            // Open the connection
            this.webSocket.onopen = (event: Event) => {
                resolve()
            }

        })
    }

    public addMessageListener(type: MessageTypes, onMessageReceived: (message: any) => void) {

        if (!this.webSocket) throw {
            message: 'Websocket not connected'
        }

        this.webSocket.onmessage = (event: MessageEvent) => {
            console.log('Message received')
            try {
                
                const data = JSON.parse(event.data)
                // TODO: Handle type here
                onMessageReceived(data)

            } catch (error) {
                console.error('JSON issue with message')
            }
        }

        this.webSocket.onclose = (event: CloseEvent) => {
            console.log('Socket closed')
            console.log(event)
        }

        this.webSocket.onerror = (event: Event) => {
            console.log('Socket error')
            console.log(event)
        }

    }

    public close() {
        if (this.webSocket) {
            this.webSocket.close()
        }
    }

    public send(data: any) {
        this.webSocket.send(JSON.stringify(data))
    }

}