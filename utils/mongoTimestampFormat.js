const timezone = require('moment-timezone')

module.exports = {
    toDate(mongoDate) {
        /* let usDate = new Date(mongoDate).toLocaleDateString()
        
        return this.dateSlashed(usDate) */
        let tz = timezone(mongoDate)

        return tz.tz('America/Sao_Paulo').format('DD/MM/YYYY')
    },

    /* dateSlashed(usDate) {
        let [ano, mes, dia] = `${usDate}`.split('-').map(value => {
            return value
        })
    
        return [dia, mes, ano].join('/')
    }, */

    toDateAndTime(mongoDate) {
        /* let usFullDate = new Date(`${mongoDate}`).toLocaleString('pt-br', {timeZone: 'GMT'})

        let dateFormated = this.dateSlashed(usFullDate.substring(0, 10))

        return `${dateFormated} ${usFullDate.split(' ')[1]}` */

        let tz = timezone(mongoDate)

        return tz.tz('America/Sao_Paulo').format('DD/MM/YYYY HH:mm')
    }
}