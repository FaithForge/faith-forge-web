---
description: "Use this prompt to generate or update JSDoc comments for functions following the project's canonical format."
---

# JSDoc Generation Prompt

When asked to generate or update JSDoc for a file, produce JSDoc comments for every function (exported and internal public helpers). Use the following rules:

- Start with a one-line summary sentence describing the function's purpose.
- Add an empty line, then `@param` tags for each parameter. Include the type and a concise description.
- Use `@returns` to describe the resolved value or thrown errors; include the type.
- Keep lines wrapped at ~100 characters and use single quotes elsewhere in code examples.

Example output for an Axios-based request function:

```
/**
 * Executes an API request using the specified method, URL, and options.
 *
 * @param {string} baseURL - The base URL of the API.
 * @param {HttpRequestMethod} method - The HTTP method to use for the request.
 * @param {string} url - The endpoint URL relative to the base URL.
 * @param {ApiRequestOptions} [options={}] - The optional parameters, data, and headers for the request.
 * @returns {Promise<AxiosResponse<any, any>>} - A promise that resolves with the Axios response.
 * @throws {Error} If an invalid HTTP method is provided.
 */
```

When updating a file, insert or replace JSDoc comments immediately above the function declaration.
