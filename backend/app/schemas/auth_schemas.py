from marshmallow import Schema, fields, validate, ValidationError

class RegisterSchema(Schema):
    email = fields.Email(required=True, error_messages={
        'required': 'Email is required',
        'invalid': 'Invalid email format'
    })
    username = fields.Str(
        required=True,
        validate=[
            validate.Length(min=3, max=80, error='Username must be between 3 and 80 characters'),
            validate.Regexp(
                r'^[a-zA-Z0-9_]+$',
                error='Username can only contain letters, numbers, and underscores'
            )
        ],
        error_messages={'required': 'Username is required'}
    )
    password = fields.Str(
        required=True,
        validate=validate.Length(min=6, error='Password must be at least 6 characters long'),
        error_messages={'required': 'Password is required'}
    )

class LoginSchema(Schema):
    email = fields.Email(required=True, error_messages={
        'required': 'Email is required',
        'invalid': 'Invalid email format'
    })
    password = fields.Str(required=True, error_messages={
        'required': 'Password is required'
    })
