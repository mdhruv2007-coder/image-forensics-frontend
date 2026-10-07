import mockResult from "../data/mockResult.json";

/**
 * Flip to false to call the real backend. This is the only switch needed.
 */
export const USE_MOCK = true;

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";
const MOCK_DELAY_MS = 800;

/**
 * Upload an image for tamper analysis.
 * @param {File} file
 * @returns {Promise<object>} parsed analysis result
 * @throws {Error} with a human-readable message on failure
 */
export async function analyzeImage(file) {
  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, MOCK_DELAY_MS));
    return mockResult;
  }

  const formData = new FormData();
  formData.append("image", file);

  let response;
  try {
    response = await fetch(`${BASE_URL}/api/analyze`, {
      method: "POST",
      body: formData,
    });
  } catch (err) {
    throw new Error(
      `Could not reach the analysis server at ${BASE_URL || "this origin"}. Check that the backend is running.`,
      { cause: err }
    );
  }

  if (!response.ok) {
    let detail = "";
    try {
      const body = await response.json();
      detail = body?.detail ? ` ${typeof body.detail === "string" ? body.detail : JSON.stringify(body.detail)}` : "";
    } catch {
      // Body wasn't JSON; fall back to status text only.
    }
    throw new Error(
      `Analysis failed (HTTP ${response.status}${response.statusText ? ` ${response.statusText}` : ""}).${detail}`
    );
  }

  try {
    return await response.json();
  } catch (err) {
    throw new Error("The analysis server returned a response that could not be read.", { cause: err });
  }
}
