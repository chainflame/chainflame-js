export default class ResponseUtils {

    public static sendError(res: any, error: any) {
        console.error(error)
        const message = error.message || 'Server error'
        const code = error.serverCode || 500
        res.status(code).json({ message: message })
    }

    public static async parse(res: any) {
        try {
            return await res.json()
        } catch (error) {
            throw {
                serverError: res.status,
                message: 'Error parsing response'
            }
        }
    }

}