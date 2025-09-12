export type SpouseDto = {
    Id: string;
    SinceYear?: number;
    SinceMonth?: number;
    SinceDay?: number;
    UntilYear?: number;
    UntilMonth?: number;
    UntilDay?: number;
};

export type SiblingDto = {
    Id: string;
    IsHalf: boolean;
};

export type PersonDto = {
    Id: string;
    FirstName?: string;
    MiddleName?: string;
    LastName?: string;
    BirthName?: string;
    Gender?: string;
    IsDead?: boolean;
    BirthDateYear?: number;
    BirthDateMonth?: number;
    BirthDateDay?: number;
    DeathDateYear?: number;
    DeathDateMonth?: number;
    DeathDateDay?: number;
    Level: number;
    Distance: number;
    Parents: string[];
    Children: string[];
    Siblings: SiblingDto[];
    Spouses: SpouseDto[];
};

export type FamilyTreeDto = {
    Root: PersonDto;
    Persons: Record<string, PersonDto>;
};

export type FeedbackDto = {
    Id: number;
    Text: string;
    Timestamp: string;
};
