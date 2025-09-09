package errors

import "fmt"

type HttpError struct {
	Code    int
	Message string
}

func (e *HttpError) Error() string {
	return fmt.Sprintf("%d %s", e.Code, e.Message)
}

func NewHttpError(code int, msg string) *HttpError {
	return &HttpError{Code: code, Message: msg}
}

type BadRequestError struct {
	*HttpError
}

func NewBadRequestError(msg string) *BadRequestError {
	if len(msg) == 0 {
		msg = "Bad Request"
	}
	return &BadRequestError{HttpError: &HttpError{Code: 400, Message: msg}}
}

type UnauthorizedError struct {
	*HttpError
}

func NewUnauthorizedError(msg string) *UnauthorizedError {
	if len(msg) == 0 {
		msg = "Unauthorized"
	}
	return &UnauthorizedError{HttpError: &HttpError{Code: 401, Message: msg}}
}

type ForbiddenError struct {
	*HttpError
}

func NewForbiddenError(msg string) *ForbiddenError {
	if len(msg) == 0 {
		msg = "Forbidden"
	}
	return &ForbiddenError{HttpError: &HttpError{Code: 403, Message: msg}}
}

type NotFoundError struct {
	*HttpError
}

func NewNotFoundError(msg string) *NotFoundError {
	if len(msg) == 0 {
		msg = "Not Found"
	}
	return &NotFoundError{HttpError: &HttpError{Code: 404, Message: msg}}
}

type ConflictError struct {
	*HttpError
}

func NewConflictError(msg string) *ConflictError {
	if len(msg) == 0 {
		msg = "Conflict"
	}
	return &ConflictError{HttpError: &HttpError{Code: 409, Message: msg}}
}

type UnprocessableEntityError struct {
	*HttpError
}

func NewUnprocessableEntityError(msg string) *UnprocessableEntityError {
	if len(msg) == 0 {
		msg = "Unprocessable Entity"
	}
	return &UnprocessableEntityError{HttpError: &HttpError{Code: 422, Message: msg}}
}

type InternalServerError struct {
	*HttpError
}

func NewInternalServerError(msg string) *InternalServerError {
	if len(msg) == 0 {
		msg = "Internal Server Error"
	}
	return &InternalServerError{HttpError: &HttpError{Code: 500, Message: msg}}
}

type NotImplementedError struct {
	*HttpError
}

func NewNotImplementedError(msg string) *NotImplementedError {
	if len(msg) == 0 {
		msg = "Not Implemented"
	}
	return &NotImplementedError{HttpError: &HttpError{Code: 501, Message: msg}}
}

type ServiceUnavailableError struct {
	*HttpError
}

func NewServiceUnavailableError(msg string) *ServiceUnavailableError {
	if len(msg) == 0 {
		msg = "Service Unavailable"
	}
	return &ServiceUnavailableError{HttpError: &HttpError{Code: 503, Message: msg}}
}
