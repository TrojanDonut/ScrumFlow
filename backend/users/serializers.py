from rest_framework import serializers
from django.contrib.auth import get_user_model, authenticate
from django.contrib.auth.password_validation import validate_password
from django.utils.translation import gettext_lazy as _
from django.conf import settings
import re
import pyotp
import qrcode
import qrcode.image.svg
import base64
from io import BytesIO

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    """
    Serializer for User model - used for listing and creating users
    """
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name',
                  'password', 'password_confirm', 'user_type', 'last_login',
                  'last_login_timestamp', 'last_login_ip']
        read_only_fields = ['last_login', 'last_login_timestamp', 'last_login_ip']

    def validate_password(self, value):
        """
        Validate password meets requirements
        """
        # Check password length
        if len(value) < 12:
            raise serializers.ValidationError(_("Password must be at least 12 characters long."))

        if len(value) > settings.PASSWORD_MAX_LENGTH:
            raise serializers.ValidationError(_(f"Password cannot be longer than {settings.PASSWORD_MAX_LENGTH} characters."))

        # Check that spaces are not trimmed
        if value != value.strip():
            raise serializers.ValidationError(_("Password cannot have leading or trailing spaces."))

        # Check for common passwords
        common_passwords = [
            "password123", "123456789", "qwerty123", "admin123", "welcome1",
            "password1", "123456", "12345678", "1234", "qwerty", "12345",
            "dragon", "baseball", "football", "letmein", "monkey", "abc123",
            "mustang", "michael", "shadow", "master", "jennifer", "111111",
            "2000", "jordan", "superman", "harley", "1234567", "hunter",
            "trustno1", "ranger", "buster", "thomas", "robert", "soccer",
            "batman", "test", "pass", "hockey", "george", "charlie",
            "andrew", "michelle", "love", "sunshine", "jessica", "pepper",
            "daniel", "access", "123456789", "654321", "joshua", "maggie",
            "starwars", "silver", "william", "dallas", "yankees", "123123",
            "ashley", "666666", "hello", "amanda", "orange", "biteme",
            "freedom", "computer", "sexy", "thunder", "nicole", "ginger",
            "heather", "hammer", "summer", "corvette", "taylor", "austin",
            "1111", "merlin", "matthew", "121212", "golfer", "cheese",
            "princess", "martin", "chelsea", "patrick", "richard", "diamond",
            "yellow", "bigdog", "secret", "asdfgh", "sparky", "cowboy"
        ]

        if value.lower() in common_passwords:
            raise serializers.ValidationError(_("This password is too common. Please choose a more secure password."))

        return value

    def validate(self, attrs):
        # Validate password again to ensure it doesn't have spaces
        password = attrs.get('password')
        if password and password != password.strip():
            raise serializers.ValidationError({"password": _("Password cannot have leading or trailing spaces.")})

        if attrs.get('password') != attrs.get('password_confirm'):
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        user = User.objects.create_user(**validated_data)
        return user


class UserDetailSerializer(serializers.ModelSerializer):
    """
    Serializer for User model - used for detailed view and updates
    """
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name',
                  'user_type', 'last_login', 'last_login_timestamp', 'last_login_ip',
                  'is_active', 'date_joined', 'two_factor_enabled']
        read_only_fields = ['last_login', 'last_login_timestamp', 'last_login_ip', 'date_joined']


class UserProfileUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for updating user profile information
    """
    class Meta:
        model = User
        fields = ['username', 'email', 'first_name', 'last_name']

    def validate_username(self, value):
        """
        Check that the username is not already taken
        """
        user = self.context['request'].user
        if User.objects.exclude(pk=user.pk).filter(username=value).exists():
            raise serializers.ValidationError(_("This username is already taken."))
        return value

    def validate_email(self, value):
        """
        Check that the email is not already taken
        """
        user = self.context['request'].user
        if User.objects.exclude(pk=user.pk).filter(email=value).exists():
            raise serializers.ValidationError(_("This email is already registered."))
        return value

    def update(self, instance, validated_data):
        """
        Update and return user instance
        """
        instance.username = validated_data.get('username', instance.username)
        instance.email = validated_data.get('email', instance.email)
        instance.first_name = validated_data.get('first_name', instance.first_name)
        instance.last_name = validated_data.get('last_name', instance.last_name)
        instance.save()
        return instance


class LoginSerializer(serializers.Serializer):
    """
    Serializer for user login
    """
    username = serializers.CharField(max_length=150, required=True)
    password = serializers.CharField(required=True, write_only=True)
    otp_token = serializers.CharField(required=False, write_only=True)

    def validate(self, attrs):
        username = attrs.get('username')
        password = attrs.get('password')
        otp_token = attrs.get('otp_token')

        if username and password:
            try:
                user = User.objects.get(username=username)
            except User.DoesNotExist:
                user = None

            if user:
                # Check if the user exists but credentials are wrong
                if not authenticate(request=self.context.get('request'),
                                    username=username, password=password):
                    user.record_failed_login()
                    msg = _('Unable to log in with provided credentials.')
                    raise serializers.ValidationError(msg, code='authorization')

                # Check if 2FA is enabled but no token provided
                if user.two_factor_enabled and not otp_token:
                    raise serializers.ValidationError({
                        'otp_token': _('Two-factor authentication token required.'),
                        'two_factor_required': True
                    }, code='two_factor_required')

                # Verify 2FA token if enabled
                if user.two_factor_enabled:
                    totp = pyotp.TOTP(user.two_factor_secret)
                    if not totp.verify(otp_token):
                        user.record_failed_login()
                        raise serializers.ValidationError({
                            'otp_token': _('Invalid two-factor authentication token.')
                        }, code='invalid_token')

                if not user.is_active:
                    msg = _('User account is disabled.')
                    raise serializers.ValidationError(msg, code='authorization')
            else:
                msg = _('Unable to log in with provided credentials.')
                raise serializers.ValidationError(msg, code='authorization')
        else:
            msg = _('Must include "username" and "password".')
            raise serializers.ValidationError(msg, code='authorization')

        attrs['user'] = user
        return attrs


class ChangePasswordSerializer(serializers.Serializer):
    """
    Serializer for changing password
    """
    old_password = serializers.CharField(required=True, write_only=True)
    new_password = serializers.CharField(required=True, write_only=True, validators=[validate_password])
    new_password_confirm = serializers.CharField(required=True, write_only=True)

    def validate_new_password(self, value):
        """
        Validate new password meets requirements
        """
        # Check password length
        if len(value) < 12:
            raise serializers.ValidationError(_("Password must be at least 12 characters long."))

        if len(value) > settings.PASSWORD_MAX_LENGTH:
            raise serializers.ValidationError(_(f"Password cannot be longer than {settings.PASSWORD_MAX_LENGTH} characters."))

        # Check that spaces are not trimmed
        if value != value.strip():
            raise serializers.ValidationError(_("Password cannot have leading or trailing spaces."))

        # Check for common passwords
        common_passwords = [
            "password123", "123456789", "qwerty123", "admin123", "welcome1",
            "password1", "123456", "12345678", "1234", "qwerty", "12345",
            "dragon", "baseball", "football", "letmein", "monkey", "abc123",
            "mustang", "michael", "shadow", "master", "jennifer", "111111",
            "2000", "jordan", "superman", "harley", "1234567", "hunter",
            "trustno1", "ranger", "buster", "thomas", "robert", "soccer",
            "batman", "test", "pass", "hockey", "george", "charlie",
            "andrew", "michelle", "love", "sunshine", "jessica", "pepper",
            "daniel", "access", "123456789", "654321", "joshua", "maggie",
            "starwars", "silver", "william", "dallas", "yankees", "123123",
            "ashley", "666666", "hello", "amanda", "orange", "biteme",
            "freedom", "computer", "sexy", "thunder", "nicole", "ginger",
            "heather", "hammer", "summer", "corvette", "taylor", "austin",
            "1111", "merlin", "matthew", "121212", "golfer", "cheese",
            "princess", "martin", "chelsea", "patrick", "richard", "diamond",
            "yellow", "bigdog", "secret", "asdfgh", "sparky", "cowboy"
        ]

        if value.lower() in common_passwords:
            raise serializers.ValidationError(_("This password is too common. Please choose a more secure password."))

        return value

    def validate(self, attrs):
        if attrs.get('new_password') != attrs.get('new_password_confirm'):
            raise serializers.ValidationError({"new_password": "Password fields didn't match."})
        return attrs


class TwoFactorSetupSerializer(serializers.Serializer):
    """
    Serializer for setting up two-factor authentication
    """
    password = serializers.CharField(required=True, write_only=True)

    def validate(self, attrs):
        user = self.context['request'].user
        password = attrs.get('password')

        if not user.check_password(password):
            raise serializers.ValidationError({"password": "Incorrect password."})

        # Generate a new secret key
        secret_key = pyotp.random_base32()
        attrs['secret_key'] = secret_key

        # Generate QR code
        totp = pyotp.TOTP(secret_key)
        uri = totp.provisioning_uri(user.email, issuer_name=settings.OTP_TOTP_ISSUER)

        # Create QR code image
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=4,
        )
        qr.add_data(uri)
        qr.make(fit=True)

        img = qr.make_image(fill_color="black", back_color="white")
        buffered = BytesIO()
        img.save(buffered)
        img_str = base64.b64encode(buffered.getvalue()).decode()

        attrs['qr_code'] = f"data:image/png;base64,{img_str}"

        return attrs


class TwoFactorVerifySerializer(serializers.Serializer):
    """
    Serializer for verifying two-factor authentication
    """
    token = serializers.CharField(required=True)
    secret_key = serializers.CharField(required=True)

    def validate(self, attrs):
        token = attrs.get('token')
        secret_key = attrs.get('secret_key')

        totp = pyotp.TOTP(secret_key)
        if not totp.verify(token):
            raise serializers.ValidationError({"token": "Invalid token."})

        return attrs
