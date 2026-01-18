const std = @import("std");

const Input = struct {
    choice: []const u8,
    betMinor: i64,
};

const Output = struct {
    result: []const u8,
    won: bool,
    payoutMinor: i64,
};

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    const stdin = std.io.getStdIn();
    const input_bytes = try stdin.readToEndAlloc(allocator, 1024 * 1024);
    defer allocator.free(input_bytes);

    var parsed = try std.json.parseFromSlice(Input, allocator, input_bytes, .{});
    defer parsed.deinit();

    const choice = parsed.value.choice;
    const bet_minor = parsed.value.betMinor;

    const flip = std.crypto.random.int(u8) % 2;
    const result = if (flip == 0) "heads" else "tails";
    const won = std.mem.eql(u8, choice, result);
    const payout_minor = if (won) bet_minor * 2 else 0;

    var out = std.ArrayList(u8).init(allocator);
    defer out.deinit();

    try std.json.stringify(
        Output{
            .result = result,
            .won = won,
            .payoutMinor = payout_minor,
        },
        .{},
        out.writer(),
    );

    try std.io.getStdOut().writeAll(out.items);
}
