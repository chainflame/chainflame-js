import { MessageTypes } from "./message-types"
import { SOCKET_URL } from "../util/constants"
import * as websocket from 'websocket'

export default class SocketManager {

    private readonly apiKey: string
    private webSocket: any | undefined

    constructor(apiKey: string) {
        this.apiKey = apiKey
    }

    public async connect() {
        return new Promise((resolve, reject) => {
            this.webSocket = new websocket.w3cwebsocket(SOCKET_URL, ['token', this.apiKey])
            this.webSocket.onopen = (event: Event) => resolve()
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
                if (data.type === type) onMessageReceived(data)
            } catch (error) {
                console.error('JSON issue with message')
            }
        }

        this.webSocket.onerror = (event: Event) => {
            console.log('Socket error')
            console.log(event)
        }

    }

    public async close() {
        return new Promise((resolve, reject) => {

            if (!this.webSocket) {
                resolve()
                return
            }

            // Close with listener
            this.webSocket.onclose = () => resolve()
            this.webSocket.close()
            
        })
    }

    public send(data: any) {
        this.webSocket.send(JSON.stringify(data))
    }

}