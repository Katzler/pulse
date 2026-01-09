/**
 * Error Message Safety Tests
 *
 * Verify that error messages don't expose sensitive information
 * and properly sanitize user input.
 */
import { describe, expect, it } from 'vitest';

import { ApplicationErrorHandler } from '@application/errors';
import { Sanitizer } from '@infrastructure/validation';

describe('Error Message Safety', () => {
  describe('ApplicationErrorHandler', () => {
    it('should not expose stack traces in user-facing messages', () => {
      const error = new Error('Internal server error');
      error.stack = `Error: Internal server error
    at processData (/app/src/services/data.service.ts:45:12)
    at async handler (/app/src/controllers/api.controller.ts:23:5)`;

      const result = ApplicationErrorHandler.handle(error);

      // User message should not contain stack trace details
      expect(result.userMessage).not.toContain('/app/src/');
      expect(result.userMessage).not.toContain('.ts:');
      expect(result.userMessage).not.toContain('at processData');
      expect(result.userMessage).not.toContain('at async handler');
    });

    it('should not expose file paths in error messages', () => {
      const error = new Error(
        "ENOENT: no such file or directory, open '/home/user/secrets/config.json'"
      );

      const result = ApplicationErrorHandler.handle(error);

      // User message should not contain file paths
      expect(result.userMessage).not.toContain('/home/');
      expect(result.userMessage).not.toContain('/user/');
      expect(result.userMessage).not.toContain('secrets');
      expect(result.userMessage).not.toContain('config.json');
    });

    it('should provide generic messages for unknown errors', () => {
      const error = new Error(
        'Database connection failed: password authentication failed for user "admin"'
      );

      const result = ApplicationErrorHandler.handle(error);

      // Should not expose database credentials or usernames
      expect(result.userMessage).not.toContain('password');
      expect(result.userMessage).not.toContain('admin');
      expect(result.userMessage).not.toContain('Database');
    });

    it('should preserve technical details for logging', () => {
      const error = new Error('Test error');
      error.stack = 'Error: Test error\n  at test.ts:10:5';

      const result = ApplicationErrorHandler.handle(error);

      // Technical message should contain the original error
      expect(result.message).toBe('Test error');
      // User message should be generic
      expect(result.userMessage).not.toContain('test.ts');
    });

    it('should handle unknown error types', () => {
      const result = ApplicationErrorHandler.unknown({ weirdError: true });

      expect(result.userMessage).toBeDefined();
      expect(result.userMessage.length).toBeGreaterThan(0);
      expect(result.code).toBe('UNKNOWN_ERROR');
    });

    it('should handle string errors', () => {
      const result = ApplicationErrorHandler.fromString('Something went wrong');

      expect(result.message).toBe('Something went wrong');
      expect(result.userMessage).toBeDefined();
    });
  });

  describe('Input Sanitization', () => {
    const sanitizer = new Sanitizer();

    it('should sanitize user input that contains XSS attempts', () => {
      const maliciousInput = '<script>alert("xss")</script>';
      const result = sanitizer.sanitizeString(maliciousInput);

      // Sanitized version should escape HTML entities
      expect(result.value).not.toContain('<script>');
      expect(result.value).toContain('&lt;script&gt;');
    });

    it('should handle various XSS patterns', () => {
      const xssPatterns = [
        { input: '<img src=x onerror=alert(1)>', shouldEscape: true },
        { input: '<a href="javascript:alert(1)">', shouldEscape: true },
        { input: 'normal text', shouldEscape: false },
        { input: "onclick='alert(1)'", shouldEscape: true }, // Contains quotes
      ];

      xssPatterns.forEach(({ input, shouldEscape }) => {
        const result = sanitizer.sanitizeString(input);
        if (shouldEscape) {
          // Should not contain raw < or > if it had HTML
          if (input.includes('<')) {
            expect(result.value).not.toContain('<');
          }
        } else {
          expect(result.value).toBe(input);
        }
      });
    });
  });

  describe('Sensitive Data Patterns', () => {
    const sensitivePatterns = [
      { name: 'API key', pattern: /api[_-]?key/i },
      { name: 'Password', pattern: /password/i },
      { name: 'Secret', pattern: /secret/i },
      { name: 'Token', pattern: /token/i },
      { name: 'Auth', pattern: /auth(?:orization)?/i },
      { name: 'Private key', pattern: /private[_-]?key/i },
      { name: 'Access key', pattern: /access[_-]?key/i },
    ];

    sensitivePatterns.forEach(({ name, pattern }) => {
      it(`should not expose ${name} in user messages`, () => {
        const sensitiveError = new Error(`${name}: abc123secret`);
        const result = ApplicationErrorHandler.handle(sensitiveError);

        // Generic handler should provide safe message
        expect(result.userMessage).not.toMatch(pattern);
        expect(result.userMessage).not.toContain('abc123');
      });
    });
  });

  describe('Error Boundary Safety', () => {
    it('should provide safe fallback messages for various error types', () => {
      const errors = [
        new Error('Something went wrong'),
        new TypeError('Cannot read property of undefined'),
        new RangeError('Maximum call stack size exceeded'),
      ];

      errors.forEach((error) => {
        const result = ApplicationErrorHandler.handle(error);

        // User message should be present and safe
        expect(result.userMessage).toBeDefined();
        expect(result.userMessage.length).toBeGreaterThan(0);
        expect(result.userMessage.length).toBeLessThan(500);
      });
    });

    it('should handle null and undefined gracefully', () => {
      const nullResult = ApplicationErrorHandler.unknown(null);
      const undefinedResult = ApplicationErrorHandler.unknown(undefined);

      expect(nullResult.userMessage).toBeDefined();
      expect(undefinedResult.userMessage).toBeDefined();
    });
  });
});

describe('Sanitizer HTML Escaping', () => {
  const sanitizer = new Sanitizer();

  const htmlTestCases = [
    { input: '<script>', containsEscaped: '&lt;script&gt;' },
    { input: '"><img src=x>', containsEscaped: '&quot;&gt;&lt;img' },
    { input: "onclick='alert(1)'", containsEscaped: "&#x27;" },
    { input: '&test', containsEscaped: '&amp;test' },
    { input: 'normal text', containsEscaped: 'normal text' },
  ];

  htmlTestCases.forEach(({ input, containsEscaped }) => {
    it(`should escape HTML in "${input}"`, () => {
      const result = sanitizer.sanitizeString(input);
      expect(result.value).toContain(containsEscaped);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty strings', () => {
      const result = sanitizer.sanitizeString('');
      expect(result.value).toBe('');
    });

    it('should handle strings with only special characters', () => {
      const result = sanitizer.sanitizeString('<>&"\'');
      expect(result.value).toBe('&lt;&gt;&amp;&quot;&#x27;');
    });

    it('should handle mixed content', () => {
      const input = 'Hello <b>World</b> & "Friends"';
      const result = sanitizer.sanitizeString(input);
      expect(result.value).toBe('Hello &lt;b&gt;World&lt;/b&gt; &amp; &quot;Friends&quot;');
    });

    it('should handle unicode characters safely', () => {
      const input = 'Héllo <script>wörld</script>';
      const result = sanitizer.sanitizeString(input);
      expect(result.value).toContain('Héllo');
      expect(result.value).toContain('wörld');
      expect(result.value).not.toContain('<script>');
    });
  });
});
