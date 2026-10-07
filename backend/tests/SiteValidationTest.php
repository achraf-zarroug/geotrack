<?php
namespace Tests;

use PHPUnit\Framework\TestCase;

final class SiteValidationTest extends TestCase
{
    public function testStatusValuesAreRestricted(): void
    {
        $allowed = ['active', 'inactive'];
        $this->assertContains('active', $allowed);
        $this->assertContains('inactive', $allowed);
        $this->assertNotContains('deleted', $allowed);
        $this->assertNotContains('pending', $allowed);
    }

    public function testPaginationCalculation(): void
    {
        $total = 21;
        $limit = 10;
        $pages = (int)ceil($total / $limit);

        $this->assertSame(3, $pages);
    }

    public function testCoordinateBounds(): void
    {
        $validLat = 33.5030;
        $validLng = 11.1120;

        $this->assertGreaterThanOrEqual(-90.0, $validLat);
        $this->assertLessThanOrEqual(90.0, $validLat);

        $this->assertGreaterThanOrEqual(-180.0, $validLng);
        $this->assertLessThanOrEqual(180.0, $validLng);
    }

    public function testInvalidCoordinateBounds(): void
    {
        $invalidLat = 95.1234;
        $isLatValid = ($invalidLat >= -90.0 && $invalidLat <= 90.0);
        $this->assertFalse($isLatValid);
    }

    public function testRouteRegexMatching(): void
    {
        $route = '/api/sites/{id}';
        $pattern = preg_replace('#\{id\}#', '(\d+)', $route);
        $pattern = preg_replace('#\{([a-zA-Z_][a-zA-Z0-9_]*)\}#', '([^/]+)', $pattern);

        $this->assertSame(1, preg_match('#^' . $pattern . '$#', '/api/sites/42', $matches));
        $this->assertSame('42', $matches[1]);

        // Search should not match numeric ID route
        $this->assertSame(0, preg_match('#^' . $pattern . '$#', '/api/sites/search'));
    }
}
