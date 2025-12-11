export class JSONSerializer {
  static serialize<T>(message: T) {
    return JSON.stringify(message)
  }

  static deserialize<T>(raw: string): T {
    return JSON.parse(raw)
  }
}

export class ProtobufSerializer {
  static serialize<T>(message: T): ArrayBuffer {
    // TODO
    return message as ArrayBuffer
  }

  static deserialize<T>(raw: ArrayBuffer): T {
    // TODO
    return raw as T
  }
}
