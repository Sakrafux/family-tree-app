package service

import (
	"database/sql"

	"github.com/Sakrafux/family-tree-app/backend/internal/db"
	"github.com/Sakrafux/family-tree-app/backend/internal/errors"
	"github.com/samber/lo"
)

type FeedbackService struct {
	db *sql.DB
}

func NewFeedbackService(db *sql.DB) *FeedbackService {
	return &FeedbackService{db: db}
}

func (s *FeedbackService) GetAllFeedbacks() ([]*FeedbackDto, error) {
	feedbacks, err := db.SelectAllFeedbacks(s.db)
	if err != nil {
		return nil, errors.NewInternalServerError(err.Error())
	}

	dtos := lo.Map(feedbacks, func(item *db.Feedback, index int) *FeedbackDto {
		return &FeedbackDto{item}
	})

	return dtos, nil
}

func (s *FeedbackService) PostFeedback(text string) (*FeedbackDto, error) {
	fb, err := db.InsertFeedback(s.db, text)
	if err != nil {
		return nil, errors.NewInternalServerError(err.Error())
	}

	dto := &FeedbackDto{fb}

	return dto, nil
}

func (s *FeedbackService) ResolveFeedback(id int, isResolved bool) error {
	err := db.UpdateFeedbackIsResolved(s.db, id, isResolved)
	if err != nil {
		return errors.NewInternalServerError(err.Error())
	}
	return nil
}
