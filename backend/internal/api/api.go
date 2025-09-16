package api

import (
	"database/sql"
	"encoding/json"
	"math"
	"net/http"
	"strconv"

	"github.com/Sakrafux/family-tree-app/backend/internal/errors"
	"github.com/Sakrafux/family-tree-app/backend/internal/service"
	"github.com/google/uuid"
	"github.com/kuzudb/go-kuzu"
)

type Handler struct {
	conn              *kuzu.Connection
	familyTreeService *service.FamilyTreeService
	feedbackService   *service.FeedbackService
	securityService   *service.SecurityService
}

func NewHandler(kuzuConn *kuzu.Connection, sqlDb *sql.DB) *Handler {
	return &Handler{
		conn:              kuzuConn,
		familyTreeService: service.NewFamilyTreeService(kuzuConn),
		feedbackService:   service.NewFeedbackService(sqlDb),
		securityService:   service.NewSecurityService(sqlDb),
	}
}

func (h *Handler) GetFamilyTree(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(r.PathValue("id"))
	if err != nil {
		errors.HandleHttpError(w, r, errors.NewBadRequestError(err.Error()))
		return
	}
	distance := math.MaxInt
	if r.URL.Query().Has("distance") {
		distance, err = strconv.Atoi(r.URL.Query().Get("distance"))
		if err != nil {
			errors.HandleHttpError(w, r, errors.NewBadRequestError(err.Error()))
			return
		}
	}

	if err = allowDummyDataForUnauthorized(r, r.PathValue("id")); err != nil {
		errors.HandleHttpError(w, r, err)
	}

	data, err := h.familyTreeService.GetFamilyTree(id, distance)
	if err != nil {
		errors.HandleHttpError(w, r, err)
		return
	}

	writeJson(w, data)
}

func (h *Handler) GetAllFeedbacks(w http.ResponseWriter, r *http.Request) {
	data, err := h.feedbackService.GetAllFeedbacks()
	if err != nil {
		errors.HandleHttpError(w, r, err)
		return
	}

	writeJson(w, data)
}

func (h *Handler) PostFeedback(w http.ResponseWriter, r *http.Request) {
	var fbr service.PostFeedbackRequest
	err := json.NewDecoder(r.Body).Decode(&fbr)
	if err != nil {
		errors.HandleHttpError(w, r, errors.NewUnprocessableEntityError(err.Error()))
	}

	data, err := h.feedbackService.PostFeedback(fbr.Text)
	if err != nil {
		errors.HandleHttpError(w, r, err)
		return
	}

	w.WriteHeader(http.StatusCreated)
	writeJson(w, data)
}

func (h *Handler) PatchFeedbackResolve(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(r.PathValue("id"))
	if err != nil {
		errors.HandleHttpError(w, r, errors.NewBadRequestError(err.Error()))
		return
	}

	var fbr service.PatchFeedbackResolveRequest
	err = json.NewDecoder(r.Body).Decode(&fbr)
	if err != nil {
		errors.HandleHttpError(w, r, errors.NewUnprocessableEntityError(err.Error()))
	}

	err = h.feedbackService.ResolveFeedback(id, fbr.IsResolved)
	if err != nil {
		errors.HandleHttpError(w, r, err)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
