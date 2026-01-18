:- use_module(library(http/json)).
:- use_module(library(lists)).
:- use_module(library(random)).

read_json(Input) :-
    read_string(user_input, _, InputString),
    atom_string(Atom, InputString),
    atom_json_dict(Atom, Input, []).

write_json(Output) :-
    json_write_dict(current_output, Output),
    halt(0).

main :-
    read_json(Input),
    Action = Input.get(action),
    ( Action = "generate_mines" ->
        MineCount = Input.get(mineCount),
        generate_mines(MineCount, Positions),
        write_json(_{minePositions: Positions})
    ; Action = "reveal_tile" ->
        State = Input.get(state),
        Position = Input.get(position),
        reveal_tile(State, Position, NextState),
        write_json(NextState)
    ; Action = "cash_out" ->
        State = Input.get(state),
        cash_out(State, NextState, PayoutMinor),
        write_json(_{state: NextState, payoutMinor: PayoutMinor})
    ; write_json(_{error: "unknown_action"})
    ).

generate_mines(MineCount, Positions) :-
    generate_positions(MineCount, [], Positions).

generate_positions(0, Acc, Positions) :-
    sort(Acc, Positions).
generate_positions(N, Acc, Positions) :-
    N > 0,
    random_between(0, 24, Pos),
    ( member(Pos, Acc) ->
        generate_positions(N, Acc, Positions)
    ; N1 is N - 1,
      generate_positions(N1, [Pos|Acc], Positions)
    ).

compute_multiplier(MineCount, SafeReveals, Multiplier) :-
    SafeTiles is 25 - MineCount,
    RemainingSafe is SafeTiles - SafeReveals,
    ( RemainingSafe =< 0 ->
        ( SafeTiles > 0 -> Multiplier = SafeTiles ; Multiplier = 1 )
    ; Ratio is SafeTiles / RemainingSafe,
      Rounded is round(Ratio * 100) / 100,
      Multiplier = Rounded
    ).

reveal_tile(State, Position, NextState) :-
    Status = State.get(status),
    ( Status \= "ACTIVE" ->
        NextState = State
    ; Revealed = State.get(revealed),
      ( member(Position, Revealed) ->
          NextState = State
      ; MinePositions = State.get(minePositions),
        append(Revealed, [Position], NextRevealed),
        ( member(Position, MinePositions) ->
            NextState = State.put(_{revealed: NextRevealed, status: "BUST"})
        ; MineCount = State.get(mineCount),
          length(NextRevealed, SafeReveals),
          compute_multiplier(MineCount, SafeReveals, Multiplier),
          NextState = State.put(_{revealed: NextRevealed, multiplier: Multiplier})
        )
      )
    ).

cash_out(State, NextState, PayoutMinor) :-
    Status = State.get(status),
    ( Status \= "ACTIVE" ->
        NextState = State,
        PayoutMinor = 0
    ; BetMinor = State.get(betMinor),
      Multiplier = State.get(multiplier),
      PayoutMinorFloat is floor(BetMinor * Multiplier),
      NextState = State.put(_{status: "CASHED"}),
      PayoutMinor = PayoutMinorFloat
    ).

:- initialization(main).
