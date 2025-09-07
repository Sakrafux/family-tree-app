# Generator Examples

## Mapper

### Command
``//go:generate go run ../path/to/generators/mapper_generator.go``

### Input
```go
type PersonDto struct {
	Id         uuid.UUID
	FirstName  *string
	LastName   *string
	BirthName  *string
	Gender     *string
	Dead       *bool
	BirthDate  *time.Time
	DeathDate  *time.Time
	Id2        uuid.UUID  `map-from:"Id"`
	Id3        *uuid.UUID `map-from:"Id" map-pointer:"VtP"`
	FirstName2 string     `map-from:"FirstName" map-pointer:"PtV"`
	FullName   *string    `map-func:"mapFullName"`
	Something  any        `map-ignore:"true"`
}
```

### Output
```go
type PersonDtoSource interface {
    GetId() uuid.UUID
    GetFirstName() *string
    GetLastName() *string
    GetBirthName() *string
    GetGender() *string
    GetDead() *bool
    GetBirthDate() *time.Time
    GetDeathDate() *time.Time
}

func MapToPersonDto(source PersonDtoSource) *PersonDto {
    persondto := &PersonDto{}
    
    id := source.GetId()
    persondto.Id = id
    firstname := source.GetFirstName()
    persondto.FirstName = firstname
    lastname := source.GetLastName()
    persondto.LastName = lastname
    birthname := source.GetBirthName()
    persondto.BirthName = birthname
    gender := source.GetGender()
    persondto.Gender = gender
    dead := source.GetDead()
    persondto.Dead = dead
    birthdate := source.GetBirthDate()
    persondto.BirthDate = birthdate
    deathdate := source.GetDeathDate()
    persondto.DeathDate = deathdate
    id2 := source.GetId()
    persondto.Id2 = id2
    id3 := source.GetId()
    persondto.Id3 = &id3
    firstname2 := source.GetFirstName()
    if firstname2 != nil {
        persondto.FirstName2 = *firstname2
    }
    persondto.FullName = mapFullName(source)

    return persondto
}
```

## Caster

### Command
``//go:generate go run ../path/to/generators/caster_generator.go``

### Input
```go
type Person struct {
	Id        uuid.UUID  `cast-source:"Id"`
	FirstName *string    `cast-source:"FirstName"`
	LastName  *string    `cast-source:"LastName"`
	BirthName *string    `cast-source:"BirthName"`
	Gender    *string    `cast-source:"Gender"`
	Dead      *bool      `cast-source:"Dead"`
	BirthDate *time.Time `cast-source:"BirthDate"`
	DeathDate *time.Time `cast-source:"DeathDate"`
}
```

### Output
```go
func CastPerson(data map[string]any) *Person {
	person := &Person{}

	person.Id = data["Id"].(uuid.UUID)
	if firstname, ok := data["FirstName"].(string); ok {
		person.FirstName = &firstname
	}
	if lastname, ok := data["LastName"].(string); ok {
		person.LastName = &lastname
	}
	if birthname, ok := data["BirthName"].(string); ok {
		person.BirthName = &birthname
	}
	if gender, ok := data["Gender"].(string); ok {
		person.Gender = &gender
	}
	if dead, ok := data["Dead"].(bool); ok {
		person.Dead = &dead
	}
	if birthdate, ok := data["BirthDate"].(time.Time); ok {
		person.BirthDate = &birthdate
	}
	if deathdate, ok := data["DeathDate"].(time.Time); ok {
		person.DeathDate = &deathdate
	}

	return person
}
```

## Getter

### Command
``//go:generate go run ../path/to/generators/getter_generator.go``

### Input
```go
type Person struct {
	Id        uuid.UUID  `cast-source:"Id"`
	FirstName *string    `cast-source:"FirstName"`
	LastName  *string    `cast-source:"LastName"`
	BirthName *string    `cast-source:"BirthName"`
	Gender    *string    `cast-source:"Gender"`
	Dead      *bool      `cast-source:"Dead"`
	BirthDate *time.Time `cast-source:"BirthDate"`
	DeathDate *time.Time `cast-source:"DeathDate"`
}
```

### Output
```go
func (p Person) GetId() uuid.UUID {
	return p.Id
}

func (p Person) GetFirstName() *string {
	return p.FirstName
}

func (p Person) GetLastName() *string {
	return p.LastName
}

func (p Person) GetBirthName() *string {
	return p.BirthName
}

func (p Person) GetGender() *string {
	return p.Gender
}

func (p Person) GetDead() *bool {
	return p.Dead
}

func (p Person) GetBirthDate() *time.Time {
	return p.BirthDate
}

func (p Person) GetDeathDate() *time.Time {
	return p.DeathDate
}
```