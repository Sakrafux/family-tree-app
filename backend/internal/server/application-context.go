package server

import (
	"github.com/kuzudb/go-kuzu"
)

type ApplicationContext struct {
	Db   *kuzu.Database
	Conn *kuzu.Connection
}
