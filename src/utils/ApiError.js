class ApiError extends Error {
    constructor(statusCode, message = "Something Went Wrong", error = [], stack=""){
        super(message) //whenever we want to overwrite we call super
        this.statusCode = statusCode
        this.error = error
        this.data = null
        this.success = false
        if(stack){
            this.stack = stack
        }else{
            Error.captureStackTrace(this, this.constructor)
        }
    }

}
export {ApiError}