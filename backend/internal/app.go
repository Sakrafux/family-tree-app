package internal

import (
	"log"
	"net/http"

	"github.com/Sakrafux/family-tree/backend/internal/api"
	"github.com/Sakrafux/family-tree/backend/internal/db"
	"github.com/Sakrafux/family-tree/backend/internal/services"
)

type App struct {
	Services *services.Services
}

func NewApp() *App {
	return &App{Services: &services.Services{}}
}

func (a *App) ConnectToDatabase(path string) {
	a.Services.Db, a.Services.Conn = db.ConnectToDatabase(path)
}

func (a *App) CloseDatabase() {
	a.Services.Db.Close()
	a.Services.Conn.Close()
}

func (a *App) Serve(port string) {
	a.Services.Mux = http.NewServeMux()
	api.RegisterApiHandlers(a.Services)
	log.Println("Listening on :" + port + "...")
	panic(http.ListenAndServe(":"+port, a.Services.Mux))
}
