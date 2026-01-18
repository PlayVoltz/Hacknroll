use std::io::{self, Read};

use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize, Serialize)]
struct Row {
    #[serde(rename = "userId")]
    user_id: String,
    username: String,
    #[serde(rename = "creditsMinor")]
    credits_minor: i64,
    #[serde(skip_serializing_if = "Option::is_none")]
    rank: Option<i64>,
}

fn main() {
    let mut input = String::new();
    io::stdin().read_to_string(&mut input).unwrap();
    let mut rows: Vec<Row> = serde_json::from_str(&input).unwrap();

    rows.sort_by(|a, b| b.credits_minor.cmp(&a.credits_minor)); // highest first
    for (i, r) in rows.iter_mut().enumerate() {
        r.rank = Some((i + 1) as i64);
    }

    println!("{}", serde_json::to_string(&rows).unwrap());
}

