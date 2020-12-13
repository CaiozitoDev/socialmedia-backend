module.exports = {
    toDate(mongoDate) {
        let usDate = new Date(mongoDate).toLocaleDateString()
        
        return this.dateSlashed(usDate)
    },

    dateSlashed(usDate) {
        let [ano, mes, dia] = `${usDate}`.split('-').map(value => {
            return value
        })
    
        return [dia, mes, ano].join('/')
    },

    toDateAndTime(mongoDate) {
        let usFullDate = new Date(`${mongoDate}`).toLocaleString('pt-br', {timeZone: 'GMT'})

        let dateFormated = this.dateSlashed(usFullDate.substring(0, 10))

        return `${dateFormated} ${usFullDate.split(' ')[1]}`
    }
}