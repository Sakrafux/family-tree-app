package service

import (
	"database/sql"

	"github.com/Sakrafux/family-tree/backend/internal/db"
	"github.com/Sakrafux/family-tree/backend/internal/errors"
	"github.com/samber/lo"
)

type FeedbackService struct {
	db *sql.DB
}

func NewFeedbackService(db *sql.DB) *FeedbackService {
	return &FeedbackService{db: db}
}

func (s *FeedbackService) GetAllFeedbacks() ([]*FeedbackDto, error) {
	feedbacks, err := db.GetAllFeedbacks(s.db)
	if err != nil {
		return nil, errors.NewInternalServerError(err.Error())
	}

	dtos := lo.Map(feedbacks, func(item *db.Feedback, index int) *FeedbackDto {
		return &FeedbackDto{item}
	})

	return dtos, nil
}

func (s *FeedbackService) PostFeedback(text string) (*FeedbackDto, error) {
	fb, err := db.PostFeedback(s.db, text)
	if err != nil {
		return nil, errors.NewInternalServerError(err.Error())
	}

	dto := &FeedbackDto{fb}

	return dto, nil
}
