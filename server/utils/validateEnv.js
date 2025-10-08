/**
 * Environment Variable Validation
 * 
 * Validates required environment variables on startup.
 * Fails fast with helpful error messages if configuration is invalid.
 */

const requiredVars = {
  DATABASE_URL: {
    required: true,
    validate: (value) => {
      if (!value) return 'DATABASE_URL is required';
      if (!value.startsWith('postgres://') && !value.startsWith('postgresql://')) {
        return 'DATABASE_URL must be a valid PostgreSQL connection string (postgres:// or postgresql://)';
      }
      return null;
    },
    description: 'PostgreSQL connection string',
    example: 'postgresql://user:password@localhost:5432/peakself'
  },
  SESSION_SECRET: {
    required: true,
    validate: (value) => {
      if (!value) return 'SESSION_SECRET is required';
      if (value.length < 32) {
        return 'SESSION_SECRET must be at least 32 characters long for security';
      }
      return null;
    },
    description: 'Secret key for session encryption',
    example: 'use a random 32+ character string (e.g., from: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))")'
  },
  JWT_SECRET: {
    required: true,
    validate: (value) => {
      if (!value) return 'JWT_SECRET is required';
      if (value.length < 32) {
        return 'JWT_SECRET must be at least 32 characters long for security';
      }
      if (value === 'dev_jwt_secret_change_me') {
        return 'JWT_SECRET must be changed from the default value';
      }
      return null;
    },
    description: 'Secret key for JWT token signing',
    example: 'use a random 32+ character string (e.g., from: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))")'
  },
  NODE_ENV: {
    required: true,
    validate: (value) => {
      if (!value) return 'NODE_ENV is required';
      const validEnvs = ['development', 'production', 'test'];
      if (!validEnvs.includes(value)) {
        return `NODE_ENV must be one of: ${validEnvs.join(', ')}`;
      }
      return null;
    },
    description: 'Application environment',
    example: 'development, production, or test'
  }
};

const optionalVars = {
  PORT: {
    validate: (value) => {
      if (value && isNaN(parseInt(value))) {
        return 'PORT must be a valid number';
      }
      return null;
    },
    description: 'Server port',
    default: '5000'
  },
  GOOGLE_CLIENT_ID: {
    description: 'Google OAuth client ID (optional, for OAuth login)',
    default: 'not set'
  },
  GOOGLE_CLIENT_SECRET: {
    description: 'Google OAuth client secret (optional, for OAuth login)',
    default: 'not set'
  },
  SMTP_HOST: {
    description: 'SMTP server host (optional, for email)',
    default: 'not set'
  },
  SMTP_PORT: {
    validate: (value) => {
      if (value && isNaN(parseInt(value))) {
        return 'SMTP_PORT must be a valid number';
      }
      return null;
    },
    description: 'SMTP server port (optional, for email)',
    default: '587'
  }
};

/**
 * Validates all environment variables
 * @throws {Error} If validation fails
 */
function validateEnv() {
  const errors = [];
  const warnings = [];
  const isDevelopment = process.env.NODE_ENV === 'development';

  // Validate required variables
  for (const [key, config] of Object.entries(requiredVars)) {
    const value = process.env[key];
    
    if (config.required && !value) {
      errors.push({
        variable: key,
        error: `${key} is required but not set`,
        description: config.description,
        example: config.example
      });
      continue;
    }

    if (config.validate && value) {
      const validationError = config.validate(value);
      if (validationError) {
        errors.push({
          variable: key,
          error: validationError,
          description: config.description,
          example: config.example
        });
      }
    }
  }

  // Validate optional variables (warnings only)
  for (const [key, config] of Object.entries(optionalVars)) {
    const value = process.env[key];
    
    if (config.validate && value) {
      const validationError = config.validate(value);
      if (validationError) {
        warnings.push({
          variable: key,
          warning: validationError,
          description: config.description
        });
      }
    }
  }

  // Check for development-specific issues
  if (!isDevelopment) {
    // In production, warn about missing optional but important vars
    if (!process.env.SMTP_HOST) {
      warnings.push({
        variable: 'SMTP_HOST',
        warning: 'Email functionality will not work without SMTP configuration',
        description: 'SMTP server for sending emails'
      });
    }
  }

  // Print warnings
  if (warnings.length > 0) {
    console.warn('\n⚠️  Environment Variable Warnings:');
    console.warn('═'.repeat(80));
    warnings.forEach(({ variable, warning, description }) => {
      console.warn(`\n⚠️  ${variable}`);
      console.warn(`   Warning: ${warning}`);
      console.warn(`   Description: ${description}`);
    });
    console.warn('\n' + '═'.repeat(80) + '\n');
  }

  // Handle errors
  if (errors.length > 0) {
    console.error('\n❌ Environment Variable Validation Failed!');
    console.error('═'.repeat(80));
    console.error('\nThe following required environment variables are missing or invalid:\n');
    
    errors.forEach(({ variable, error, description, example }) => {
      console.error(`❌ ${variable}`);
      console.error(`   Error: ${error}`);
      console.error(`   Description: ${description}`);
      if (example) {
        console.error(`   Example: ${example}`);
      }
      console.error('');
    });

    console.error('═'.repeat(80));
    console.error('\n📝 Setup Instructions:');
    console.error('   1. Create a .env file in the project root (if it doesn\'t exist)');
    console.error('   2. Add the missing variables listed above');
    console.error('   3. Restart the server');
    console.error('\n💡 Tip: You can copy .env.example to .env and fill in the values\n');
    console.error('═'.repeat(80) + '\n');

    // Exit the process
    process.exit(1);
  }

  // Success message
  console.log('✅ Environment variables validated successfully');
  console.log(`   Environment: ${process.env.NODE_ENV}`);
  console.log(`   Database: ${process.env.DATABASE_URL.split('@')[1] || 'configured'}`);
  
  // Show optional config status in development
  if (isDevelopment) {
    const optionalStatus = [];
    if (process.env.GOOGLE_CLIENT_ID) optionalStatus.push('Google OAuth');
    if (process.env.SMTP_HOST) optionalStatus.push('Email/SMTP');
    
    if (optionalStatus.length > 0) {
      console.log(`   Optional features: ${optionalStatus.join(', ')}`);
    }
  }
  console.log('');
}

export default validateEnv;
