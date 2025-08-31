package services

import (
	"net/http"

	"github.com/kuzudb/go-kuzu"
)

type Services struct {
	Db   *kuzu.Database
	Conn *kuzu.Connection
	Mux  *http.ServeMux
}
