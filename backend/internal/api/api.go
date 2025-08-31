package api

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/Sakrafux/family-tree/backend/internal/db"
	"github.com/Sakrafux/family-tree/backend/internal/services"
)

func RegisterApiHandlers(s *services.Services) {
	apiMux := http.NewServeMux()

	apiMux.HandleFunc("GET /nodes/persons", getAllPersons(s))
	apiMux.HandleFunc("GET /relations/marriages", getAllMarriageRelations(s))
	apiMux.HandleFunc("GET /relations/parents", getAllParentRelations(s))
	apiMux.HandleFunc("GET /graph/complete", getCompleteGraphData(s))

	s.Mux.Handle("/api/", http.StripPrefix("/api", apiMux))
}

func writeJson(w http.ResponseWriter, data any) {
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

func getCompleteGraphData(s *services.Services) func(w http.ResponseWriter, r *http.Request) {
	return func(w http.ResponseWriter, r *http.Request) {
		log.Println("GET /graph/complete")

		persons, err := db.GetAllPersons(s.Conn)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
		}
		marriages, err := db.GetAllMarriageRelations(s.Conn)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
		}
		parents, err := db.GetAllParentRelations(s.Conn)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
		}

		container := map[string]any{
			"persons":   persons,
			"marriages": marriages,
			"parents":   parents,
		}

		writeJson(w, container)
	}
}

func getAllPersons(s *services.Services) func(w http.ResponseWriter, r *http.Request) {
	return func(w http.ResponseWriter, r *http.Request) {
		log.Println("GET /nodes/persons")

		data, err := db.GetAllPersons(s.Conn)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
		}

		writeJson(w, data)
	}
}

func getAllMarriageRelations(s *services.Services) func(w http.ResponseWriter, r *http.Request) {
	return func(w http.ResponseWriter, r *http.Request) {
		log.Println("GET /relations/marriages")

		data, err := db.GetAllMarriageRelations(s.Conn)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
		}

		writeJson(w, data)
	}
}

func getAllParentRelations(s *services.Services) func(w http.ResponseWriter, r *http.Request) {
	return func(w http.ResponseWriter, r *http.Request) {
		log.Println("GET /relations/parents")

		data, err := db.GetAllParentRelations(s.Conn)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
		}

		writeJson(w, data)
	}
}
