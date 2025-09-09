package errors

import "net/http"

func HandleHttpError(w http.ResponseWriter, r *http.Request, err error) {
	switch e := err.(type) {
	case *BadRequestError:
		http.Error(w, e.Error(), http.StatusBadRequest)
	case *UnauthorizedError:
		http.Error(w, e.Error(), http.StatusUnauthorized)
	case *ForbiddenError:
		http.Error(w, e.Error(), http.StatusForbidden)
	case *NotFoundError:
		http.Error(w, e.Error(), http.StatusNotFound)
	case *ConflictError:
		http.Error(w, e.Error(), http.StatusConflict)
	case *UnprocessableEntityError:
		http.Error(w, e.Error(), http.StatusUnprocessableEntity)
	case *InternalServerError:
		http.Error(w, e.Error(), http.StatusInternalServerError)
	case *NotImplementedError:
		http.Error(w, e.Error(), http.StatusNotImplemented)
	case *ServiceUnavailableError:
		http.Error(w, e.Error(), http.StatusServiceUnavailable)
	case *HttpError:
		http.Error(w, e.Error(), http.StatusServiceUnavailable)
	default:
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
}
