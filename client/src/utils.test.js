import { isFlightActive } from './utils';

describe('Utility Functions', () => {
  describe('isFlightActive', () => {
    // Test cases for statuses that should be considered active
    const activeStatuses = [
      'In Air',
      'En Route',
      'Departed',
      'Approaching',
      'Landing',
      'in air', // Case-insensitivity
      'EN ROUTE', // Case-insensitivity
      'Flight is currently en route', // Contains 'en route'
    ];

    activeStatuses.forEach(status => {
      test(`should return true for active status: "${status}"`, () => {
        expect(isFlightActive(status)).toBe(true);
      });
    });

    // Test cases for statuses that should not be considered active
    const inactiveStatuses = [
      'Scheduled',
      'Landed', // 'Landed' is tricky. isFlightActive includes 'landing'. If 'Landed' means fully stopped, it might be inactive.
                  // Current isFlightActive includes 'landing' which implies it's still somewhat active for map.
                  // For this test, let's assume 'Landed' (past tense) is inactive for map.
      'Cancelled',
      'Diverted',
      'Unknown',
      'Delayed',
      null,
      undefined,
      '',
      'On Gate',
      'Arrived',
    ];

    inactiveStatuses.forEach(status => {
      test(`should return false for inactive status: "${status}"`, () => {
        if (status === 'Landed' && isFlightActive('Landing')) { // Adjusting for the 'Landing' vs 'Landed' nuance
            // If 'Landing' is true, then 'Landed' should ideally be false if it means "no longer moving".
            // However, the current `isFlightActive` includes 'landing'. Let's assume the current logic of isFlightActive
            // is what we test against. If 'landing' is active, the map shows. If 'Landed' (past tense) means "done", map might not.
            // The current function returns true for "Landing". Let's test "Landed" as distinct.
            // The current isFlightActive would return false for "Landed" as it doesn't explicitly match.
             expect(isFlightActive(status)).toBe(false);
        } else {
            expect(isFlightActive(status)).toBe(false);
        }
      });
    });
     test('should return false for "Landed" specifically if "Landing" is active', () => {
        // This clarifies the distinction based on the current isFlightActive implementation
        expect(isFlightActive('Landed')).toBe(false); // because 'landed' does not match 'landing' substring
    });
  });

  // Add tests for other utility functions if any are added to utils.js
});
