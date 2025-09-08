package api

import (
	"net/http"
	"strconv"

	"github.com/Sakrafux/family-tree/backend/internal/db"
	"github.com/google/uuid"
	"github.com/kuzudb/go-kuzu"
)

type Handler struct {
	conn *kuzu.Connection
}

func NewHandler(conn *kuzu.Connection) *Handler {
	return &Handler{conn: conn}
}

func (h *Handler) GetCompleteGraphData(w http.ResponseWriter, r *http.Request) {
	wg, chErr := initAsync(4)

	chP := asyncDbCall(wg, chErr, func() ([]*db.Person, error) {
		return db.GetAllPersons(h.conn)
	})
	chMR := asyncDbCall(wg, chErr, func() ([]*db.MarriageRelation, error) {
		return db.GetAllMarriageRelations(h.conn)
	})
	chPR := asyncDbCall(wg, chErr, func() ([]*db.ParentRelation, error) {
		return db.GetAllParentRelations(h.conn)
	})
	chS := asyncDbCall(wg, chErr, func() ([]*db.SiblingRelation, error) {
		return db.GetAllSiblingRelations(h.conn)
	})

	wg.Wait()

	select {
	case err := <-chErr:
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	default:
	}

	container := map[string]any{
		"persons":   <-chP,
		"marriages": <-chMR,
		"parents":   <-chPR,
		"siblings":  <-chS,
	}

	writeJson(w, container)
}

func (h *Handler) GetAllPersons(w http.ResponseWriter, r *http.Request) {
	data, err := db.GetAllPersons(h.conn)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	writeJson(w, data)
}

func (h *Handler) GetAllMarriageRelations(w http.ResponseWriter, r *http.Request) {
	data, err := db.GetAllMarriageRelations(h.conn)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	writeJson(w, data)
}

func (h *Handler) GetAllParentRelations(w http.ResponseWriter, r *http.Request) {
	data, err := db.GetAllParentRelations(h.conn)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	writeJson(w, data)
}

func (h *Handler) GetAllSiblingRelations(w http.ResponseWriter, r *http.Request) {
	data, err := db.GetAllSiblingRelations(h.conn)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	writeJson(w, data)
}

func (h *Handler) GetGraphDistancesForRootByName(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(r.URL.Query().Get("id"))
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	data, err := db.GetGraphDistancesForRootById(h.conn, id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	writeJson(w, data)
}

func (h *Handler) GetSubgraphForRoot(w http.ResponseWriter, r *http.Request) {
	if r.URL.Query().Has("id") {
		h.getSubgraphForRootById(w, r)
	} else if r.URL.Query().Has("firstName") && r.URL.Query().Has("lastName") {
		h.getSubgraphForRootByName(w, r)
	} else {
		http.Error(w, "Invalid query parameters", http.StatusInternalServerError)
	}
}

func (h *Handler) getSubgraphForRootByName(w http.ResponseWriter, r *http.Request) {
	firstName := r.URL.Query().Get("firstName")
	lastName := r.URL.Query().Get("lastName")
	distance, err := strconv.Atoi(r.URL.Query().Get("distance"))
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	data, err := db.GetSubgraphForRootByName(h.conn, distance, firstName, lastName)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	writeJson(w, data)
}

func (h *Handler) getSubgraphForRootById(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(r.URL.Query().Get("id"))
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	distance, err := strconv.Atoi(r.URL.Query().Get("distance"))
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	data, err := db.GetSubgraphForRootById(h.conn, distance, id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	writeJson(w, data)
}
