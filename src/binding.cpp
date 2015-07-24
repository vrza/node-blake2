#include <node.h>
#include <node_buffer.h>
#include <v8.h>
#include <nan.h>
#include <cstddef>
#include <cassert>
#include <cstring>

#include "blake2.h"

union any_blake2_state {
	blake2b_state casted_blake2b_state;
	blake2bp_state casted_blake2bp_state;
	blake2s_state casted_blake2s_state;
	blake2sp_state casted_blake2sp_state;
};

#define BLAKE_FN_CAST(fn) \
	reinterpret_cast<int (*)(void*, const uint8_t*, uint64_t)>(fn)

using namespace node;
using namespace v8;

class Hash: public ObjectWrap {
protected:
	bool initialized_;
	int (*any_blake2_update)(void*, const uint8_t*, uint64_t);
	int (*any_blake2_final)(void*, const uint8_t*, uint64_t);
	int outbytes;
	any_blake2_state state;

public:
	static void
	Initialize(Handle<Object> target) {
		NanScope();

		Local<FunctionTemplate> t = NanNew<FunctionTemplate>(New);
		t->InstanceTemplate()->SetInternalFieldCount(1);
		t->SetClassName(NanNew<String>("Hash"));

		NODE_SET_PROTOTYPE_METHOD(t, "update", Update);
		NODE_SET_PROTOTYPE_METHOD(t, "digest", Digest);
		NODE_SET_PROTOTYPE_METHOD(t, "copy", Copy);

		NanAssignPersistent(constructor, t->GetFunction());
		target->Set(NanNew<String>("Hash"), t->GetFunction());
	}

	static
	NAN_METHOD(New) {
		NanScope();

		if(!args.IsConstructCall()) {
			return NanThrowError("Constructor must be called with new");
		}

		Hash *obj = new Hash();
		obj->Wrap(args.This());
		if(args.Length() < 1 || !args[0]->IsString()) {
			return NanThrowError(Exception::TypeError(NanNew<String>("First argument must be a string with algorithm name")));
		}
		const char *key_data = nullptr;
		size_t key_length;
		if(args.Length() >= 2) {
			if(!Buffer::HasInstance(args[1])) {
				return NanThrowError(Exception::TypeError(NanNew<String>("If key argument is given, it must be a Buffer")));
			}
			key_data = Buffer::Data(args[1]);
			key_length = Buffer::Length(args[1]);
		}
		std::string algo = std::string(*String::Utf8Value(args[0]->ToString()));
		if(algo == "blake2b") {
			if(!key_data) {
				if(blake2b_init(reinterpret_cast<blake2b_state*>(&obj->state), BLAKE2B_OUTBYTES) != 0) {
					return NanThrowError("blake2b_init failure");
				}
			} else {
				if(key_length > BLAKE2B_KEYBYTES) {
					return NanThrowError("Key must be 64 bytes or smaller");
				}
				if(blake2b_init_key(reinterpret_cast<blake2b_state*>(&obj->state), BLAKE2B_OUTBYTES, key_data, key_length) != 0) {
					return NanThrowError("blake2b_init_key failure");
				}
			}
			obj->outbytes = 512 / 8;
			obj->any_blake2_update = BLAKE_FN_CAST(blake2b_update);
			obj->any_blake2_final = BLAKE_FN_CAST(blake2b_final);
		} else if(algo == "blake2bp") {
			if(!key_data) {
				if(blake2bp_init(reinterpret_cast<blake2bp_state*>(&obj->state), BLAKE2B_OUTBYTES) != 0) {
					return NanThrowError("blake2bp_init failure");
				}
			} else {
				if(key_length > BLAKE2B_KEYBYTES) {
					return NanThrowError("Key must be 64 bytes or smaller");
				}
				if(blake2bp_init_key(reinterpret_cast<blake2bp_state*>(&obj->state), BLAKE2B_OUTBYTES, key_data, key_length) != 0) {
					return NanThrowError("blake2bp_init_key failure");
				}
			}
			obj->outbytes = 512 / 8;
			obj->any_blake2_update = BLAKE_FN_CAST(blake2bp_update);
			obj->any_blake2_final = BLAKE_FN_CAST(blake2bp_final);
		} else if(algo == "blake2s") {
			if(!key_data) {
				if(blake2s_init(reinterpret_cast<blake2s_state*>(&obj->state), BLAKE2S_OUTBYTES) != 0) {
					return NanThrowError("blake2bs_init failure");
				}
			} else {
				if(key_length > BLAKE2S_KEYBYTES) {
					return NanThrowError("Key must be 32 bytes or smaller");
				}
				if(blake2s_init_key(reinterpret_cast<blake2s_state*>(&obj->state), BLAKE2S_OUTBYTES, key_data, key_length) != 0) {
					return NanThrowError("blake2s_init_key failure");
				}
			}
			obj->outbytes = 256 / 8;
			obj->any_blake2_update = BLAKE_FN_CAST(blake2s_update);
			obj->any_blake2_final = BLAKE_FN_CAST(blake2s_final);
		} else if(algo == "blake2sp") {
			if(!key_data) {
				if(blake2sp_init(reinterpret_cast<blake2sp_state*>(&obj->state), BLAKE2S_OUTBYTES) != 0) {
					return NanThrowError("blake2sp_init failure");
				}
			} else {
				if(key_length > BLAKE2S_KEYBYTES) {
					return NanThrowError("Key must be 32 bytes or smaller");
				}
				if(blake2sp_init_key(reinterpret_cast<blake2sp_state*>(&obj->state), BLAKE2S_OUTBYTES, key_data, key_length) != 0) {
					return NanThrowError("blake2sp_init_key failure");
				}
			}
			obj->outbytes = 256 / 8;
			obj->any_blake2_update = BLAKE_FN_CAST(blake2sp_update);
			obj->any_blake2_final = BLAKE_FN_CAST(blake2sp_final);
		} else {
			return NanThrowError("Algorithm must be blake2b, blake2s, blake2bp, or blake2sp");
		}
		obj->initialized_ = true;
		NanReturnValue(args.This());
	}

	static
	NAN_METHOD(Update) {
		NanScope();

		Hash *obj = ObjectWrap::Unwrap<Hash>(args.This());

		if(!obj->initialized_) {
			Local<Value> exception = Exception::Error(NanNew<String>("Not initialized"));
			return NanThrowError(exception);
		}

		if(args.Length() < 1 || !Buffer::HasInstance(args[0])) {
			return NanThrowError(Exception::TypeError(NanNew<String>("Bad argument; need a Buffer")));
		}

		Local<Object> buffer_obj = args[0]->ToObject();
		const char *buffer_data = Buffer::Data(buffer_obj);
		size_t buffer_length = Buffer::Length(buffer_obj);
		obj->any_blake2_update(
			reinterpret_cast<void*>(&obj->state),
			reinterpret_cast<const uint8_t*>(buffer_data),
			buffer_length
		);

		NanReturnValue(args.This());
	}

	static
	NAN_METHOD(Digest) {
		NanScope();

		Hash *obj = ObjectWrap::Unwrap<Hash>(args.This());
		unsigned char digest[512 / 8];

		if(!obj->initialized_) {
			Local<Value> exception = Exception::Error(NanNew<String>("Not initialized"));
			return NanThrowError(exception);
		}

		obj->initialized_ = false;
		if(obj->any_blake2_final(reinterpret_cast<void*>(&obj->state), digest, obj->outbytes) != 0) {
			return NanThrowError("blake2*_final failure");
		}

		Local<Value> rc = NanEncode(
			reinterpret_cast<const char*>(digest),
			obj->outbytes,
			Nan::BUFFER
		);

		NanReturnValue(rc);
	}

	static
	NAN_METHOD(Copy) {
		NanScope();

		Hash *src = ObjectWrap::Unwrap<Hash>(args.This());

		Local<Function> construct = NanNew<Function>(constructor);
		Handle<Object> inst = construct->NewInstance();
		Hash *dest = new Hash();
		dest->Wrap(inst);

		dest->initialized_ = src->initialized_;
		dest->any_blake2_update = src->any_blake2_update;
		dest->any_blake2_final = src->any_blake2_final;
		dest->outbytes = src->outbytes;
		dest->state = src->state;

		NanReturnValue(inst);
	}

private:
	static Persistent<Function> constructor;
};

Persistent<Function> Hash::constructor;

static void
init(Handle<Object> target) {
	Hash::Initialize(target);
}

NODE_MODULE(binding, init)
