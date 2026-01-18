math.randomseed(os.time())

local function hex_byte()
  return string.format("%02X", math.random(0, 255))
end

local code = hex_byte() .. hex_byte() .. hex_byte() .. hex_byte()

io.write(string.format("{\"code\":\"%s\"}", code))
