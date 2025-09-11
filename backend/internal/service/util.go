package service

import (
	"cmp"
	"math"
	"sync"

	"github.com/google/uuid"
)

func initAsync(n int) (*sync.WaitGroup, chan error) {
	chErr := make(chan error, n)
	var wg sync.WaitGroup
	wg.Add(n)

	return &wg, chErr
}

func asyncDbCall[R any](wg *sync.WaitGroup, chErr chan error, cb func() (R, error)) chan R {
	chR := make(chan R, 1)

	go func() {
		defer wg.Done()
		data, err := cb()
		chR <- data
		if err != nil {
			chErr <- err
		}
	}()

	return chR
}

func derefDateInt32(p *int32) int32 {
	if p == nil {
		return math.MaxInt32
	}
	return *p
}

func compareByBirthDate(dto *FamilyTreeDto, a, b uuid.UUID) int {
	personA, ok := dto.Persons[a]
	if !ok {
		return 0
	}
	personB, ok := dto.Persons[b]
	if !ok {
		return 0
	}

	ay, by := derefDateInt32(personA.BirthDateYear), derefDateInt32(personB.BirthDateYear)
	if ay != by {
		return cmp.Compare(ay, by)
	}

	am, bm := derefDateInt32(personA.BirthDateMonth), derefDateInt32(personB.BirthDateMonth)
	if am != bm {
		return cmp.Compare(am, bm)
	}

	ad, bd := derefDateInt32(personA.BirthDateDay), derefDateInt32(personB.BirthDateDay)
	return cmp.Compare(ad, bd)
}
