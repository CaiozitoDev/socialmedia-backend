const ValidationError = require('yup').ValidationError

const errorHandler = (error, req, res, next) => {
    if(error instanceof ValidationError) {
        let errorList = {}

        error.inner.forEach(err => {
            errorList[err.path] = err.errors
        })

        return res.status(400).send({
            message: 'Validation fails.',
            errorList
        })
    }

    console.log(error)

    return res.status(500).send({
        message: 'Internal server error.'
    })
}

module.exports = errorHandler