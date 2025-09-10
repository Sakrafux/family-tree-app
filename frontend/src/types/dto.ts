type Person = {
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
};

export type CompleteGraphPerson = Person & {
    Level: number;
};

export type SubgraphPerson = Person & {
    Level: number;
    Distance?: number;
};

export type MarriageRelation = {
    Person1Id: string;
    Person2Id: string;
    SinceYear?: number;
    SinceMonth?: number;
    SinceDay?: number;
    UntilYear?: number;
    UntilMonth?: number;
    UntilDay?: number;
};

export type ParentRelation = {
    ParentId: string;
    ChildId: string;
};

export type SiblingRelation = {
    Person1Id: string;
    Person2Id: string;
    IsHalf: boolean;
};

export type CompleteGraph = {
    Persons: CompleteGraphPerson[];
    MarriageRelations: MarriageRelation[];
    ParentRelations: ParentRelation[];
    SiblingRelations: SiblingRelation[];
};

export type Subgraph = {
    Root: SubgraphPerson;
    Persons: SubgraphPerson[];
    MarriageRelations: MarriageRelation[];
    ParentRelations: ParentRelation[];
    SiblingRelations: SiblingRelation[];
};

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
