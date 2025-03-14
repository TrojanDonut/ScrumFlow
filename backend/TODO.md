# TODO List

## Security Issues

### Password Validation
- Fix password validation to properly reject passwords with leading or trailing spaces
- Currently, passwords with spaces are accepted, which could lead to security issues
- The issue is in the UserSerializer and ChangePasswordSerializer classes in users/serializers.py
- The validation is implemented but not working correctly

## Feature Improvements

### Two-Factor Authentication
- Add support for backup codes for 2FA
- Improve the UX for 2FA setup and verification 