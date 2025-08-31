package api

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/Sakrafux/family-tree/backend/internal/db"
	"github.com/Sakrafux/family-tree/backend/internal/services"
)

func RegisterHandlers(s *services.Services) {
	s.Mux.HandleFunc("GET /marriages", getAllMarriages(s))
}

func JSON(w http.ResponseWriter, data any) {
	b, err := json.Marshal(data)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
	w.Header().Set("Content-Type", "application/json")
	_, err = w.Write(b)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
}

func getAllMarriages(s *services.Services) func(w http.ResponseWriter, r *http.Request) {
	return func(w http.ResponseWriter, r *http.Request) {
		log.Println("GET /marriages")

		data, err := db.GetAllMarriages(s.Conn)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
		}

		JSON(w, data)
	}
}
