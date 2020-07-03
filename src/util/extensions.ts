export default class Extensions {

    // Removes the scientific notation
    // Limits number to 8 places.
    // i.e. 0.1234567899999 will become 0.12345678
    static clean(value: number, places: number = 8) {
        return (Math.floor(value * Math.pow(10, places)) / Math.pow(10, places)).toFixed(places)
    }

    // Drops the places after
    static cleanNumber(value: number, places: number = 8) {
        return Number(this.clean(value, places))
    }

}