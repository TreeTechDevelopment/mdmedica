
const getMonthName = month => {
    const months = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"]
    return months[month]

}

const twoDigits = number => number < 10 ? `0${number}` : number

module.exports= {
    getMonthName,
    twoDigits
}