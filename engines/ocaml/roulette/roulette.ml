let wheel_numbers =
  [| 0; 32; 15; 19; 4; 21; 2; 25; 17; 34; 6; 27; 13; 36; 11; 30; 8; 23; 10; 5;
     24; 16; 33; 1; 20; 14; 31; 9; 22; 18; 29; 7; 28; 12; 35; 3; 26 |]

let red_numbers =
  [ 1; 3; 5; 7; 9; 12; 14; 16; 18; 19; 21; 23; 25; 27; 30; 32; 34; 36 ]

let is_red n = List.exists (fun x -> x = n) red_numbers

let color_of n =
  if n = 0 then "green" else if is_red n then "red" else "black"

let () =
  Random.self_init ();
  let slice_count = 37 in
  let slice_size = 360.0 /. float_of_int slice_count in
  let wheel_index = Random.int slice_count in
  let epsilon = 0.35 in
  let jitter_range = (slice_size /. 2.0) -. epsilon in
  let jitter = ((Random.float 1.0) *. (jitter_range *. 2.0)) -. jitter_range in
  let normalized = (float_of_int wheel_index *. slice_size) +. (slice_size /. 2.0) +. jitter in
  let stop_rotation =
    let modded = mod_float normalized 360.0 in
    let base = 360.0 -. modded in
    let fixed = if base < 0.0 then base +. 360.0 else base in
    if fixed < 0.0 then fixed +. 360.0 else fixed
  in
  let winning_number = wheel_numbers.(wheel_index) in
  let color = color_of winning_number in
  Printf.printf
    "{\"color\":\"%s\",\"stopRotationDeg\":%.6f,\"wheelIndex\":%d,\"winningNumber\":%d}"
    color stop_rotation wheel_index winning_number
