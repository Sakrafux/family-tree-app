package security

import "github.com/Sakrafux/family-tree-app/backend/internal/constants"

var roleToPermissions = map[string][]string{
	"admin": {constants.AUTH_PERMISSION_READ, constants.AUTH_PERMISSION_ADMIN},
	"user":  {constants.AUTH_PERMISSION_READ},
}

func GetPermissionsForRole(role string) []string {
	return roleToPermissions[role]
}
