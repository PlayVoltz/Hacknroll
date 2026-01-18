const std = @import("std");

// Leaderboard sorting (highest balance first).
// Input format: lines like "username creditsMinor"

const Row = struct {
    username: []const u8,
    creditsMinor: i64,
};

fn lessThan(_: void, a: Row, b: Row) bool {
    return a.creditsMinor > b.creditsMinor; // highest first
}

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const alloc = gpa.allocator();

    var input = std.ArrayList(u8).init(alloc);
    defer input.deinit();
    try std.io.getStdIn().reader().readAllArrayList(&input, 1 << 20);

    var rows = std.ArrayList(Row).init(alloc);
    defer rows.deinit();

    var it = std.mem.splitScalar(u8, input.items, '\n');
    while (it.next()) |line_raw| {
        const line = std.mem.trim(u8, line_raw, " \r\t");
        if (line.len == 0) continue;

        var parts = std.mem.tokenizeAny(u8, line, " \t");
        const u = parts.next() orelse continue;
        const c = parts.next() orelse continue;
        const credits = try std.fmt.parseInt(i64, c, 10);

        // store username copy
        const u_copy = try alloc.dupe(u8, u);
        try rows.append(Row{ .username = u_copy, .creditsMinor = credits });
    }

    std.sort.block(Row, rows.items, {}, lessThan);

    const out = std.io.getStdOut().writer();
    for (rows.items, 0..) |r, idx| {
        try out.print("{d} {s} {d}\n", .{ idx + 1, r.username, r.creditsMinor });
    }
}

