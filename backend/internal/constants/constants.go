// While it may not be idiomatic in Go to use a central `constants` package,
// this prevents any cyclical import issues that may occur otherwise

package constants

const (
	AUTH_PERMISSION_READ  = "READ"
	AUTH_PERMISSION_ADMIN = "ADMIN"

	AUTH_CONTEXT_USERNAME    = "username"
	AUTH_CONTEXT_ROLE        = "role"
	AUTH_CONTEXT_PERMISSIONS = "permissions"
	AUTH_CONTEXT_NODE        = "node"
)
