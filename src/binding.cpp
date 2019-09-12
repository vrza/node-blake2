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
	reinterpret_cast<uintptr_t (*)(void*, const uint8_t*, uint64_t)>(fn)

static Nan::Persistent<v8::FunctionTemplate> hash_constructor;

class Hash: public Nan::ObjectWrap {
protected:
	bool initialized_;
	uintptr_t (*any_blake2_update)(void*, const uint8_t*, uint64_t);
	uintptr_t (*any_blake2_final)(void*, const uint8_t*, uint64_t);
	uint8_t outbytes;
	any_blake2_state state;

public:
	static void
	Init(v8::Local<v8::Object> target) {
		v8::Local<v8::FunctionTemplate> tpl = Nan::New<v8::FunctionTemplate>(New);
		hash_constructor.Reset(tpl);
		tpl->SetClassName(Nan::New<v8::String>("Hash").ToLocalChecked());
		tpl->InstanceTemplate()->SetInternalFieldCount(1);
		Nan::SetPrototypeMethod(tpl, "update", Update);
		Nan::SetPrototypeMethod(tpl, "digest", Digest);
		Nan::SetPrototypeMethod(tpl, "copy", Copy);
		target->Set(Nan::GetCurrentContext(), Nan::New("Hash").ToLocalChecked(), Nan::GetFunction(tpl).ToLocalChecked());
	}

	static
	NAN_METHOD(New) {
		if (!info.IsConstructCall()) {
			return Nan::ThrowError("Constructor must be called with new");
		}

		Hash *obj = new Hash();
		obj->Wrap(info.This());
		if (info.Length() < 1 || !info[0]->IsString()) {
			return Nan::ThrowError(v8::Exception::TypeError(Nan::New<v8::String>("First argument must be a string with algorithm name").ToLocalChecked()));
		}
		std::string algo = std::string(*v8::String::Utf8Value(v8::Isolate::GetCurrent(), info[0]->ToString(Nan::GetCurrentContext()).FromMaybe(v8::Local<v8::String>())));

		const char *key_data = nullptr;
		size_t key_length;
		int8_t digest_length = -1;
		if (algo != "bypass" && info.Length() >= 2) {
			if (!info[1]->IsNull()) {
				if (!node::Buffer::HasInstance(info[1])) {
					return Nan::ThrowError(v8::Exception::TypeError(Nan::New<v8::String>("If key argument is given, it must be a Buffer").ToLocalChecked()));
				}
				key_data = node::Buffer::Data(info[1]);
				key_length = node::Buffer::Length(info[1]);
			}

			if (info.Length() >= 3) {
				if (!info[2]->IsNumber()) {
					return Nan::ThrowError(v8::Exception::TypeError(Nan::New<v8::String>("digestLength must be a number").ToLocalChecked()));
				}
				digest_length = info[2]->IntegerValue(Nan::GetCurrentContext()).ToChecked();
			}
		}

		if (algo == "bypass") {
			// Initialize nothing - .copy() will set up all the state
		} else if (algo == "blake2b") {
			if (digest_length == -1) {
				digest_length = BLAKE2B_OUTBYTES;
			} else if (digest_length < 1 || digest_length > BLAKE2B_OUTBYTES) {
				return Nan::ThrowError("digestLength must be between 1 and 64");
			}

			if (!key_data) {
				if (blake2b_init(reinterpret_cast<blake2b_state*>(&obj->state), digest_length) != 0) {
					return Nan::ThrowError("blake2b_init failure");
				}
			} else {
				if (key_length > BLAKE2B_KEYBYTES) {
					return Nan::ThrowError("Key must be 64 bytes or smaller");
				}
				if (blake2b_init_key(reinterpret_cast<blake2b_state*>(&obj->state), digest_length, key_data, key_length) != 0) {
					return Nan::ThrowError("blake2b_init_key failure");
				}
			}
			obj->outbytes = digest_length;
			obj->any_blake2_update = BLAKE_FN_CAST(blake2b_update);
			obj->any_blake2_final = BLAKE_FN_CAST(blake2b_final);
			obj->initialized_ = true;
		} else if (algo == "blake2bp") {
			if (digest_length == -1) {
				digest_length = BLAKE2B_OUTBYTES;
			} else if (digest_length < 1 || digest_length > BLAKE2B_OUTBYTES) {
				return Nan::ThrowError("digestLength must be between 1 and 64");
			}

			if (!key_data) {
				if (blake2bp_init(reinterpret_cast<blake2bp_state*>(&obj->state), digest_length) != 0) {
					return Nan::ThrowError("blake2bp_init failure");
				}
			} else {
				if (key_length > BLAKE2B_KEYBYTES) {
					return Nan::ThrowError("Key must be 64 bytes or smaller");
				}
				if (blake2bp_init_key(reinterpret_cast<blake2bp_state*>(&obj->state), digest_length, key_data, key_length) != 0) {
					return Nan::ThrowError("blake2bp_init_key failure");
				}
			}
			obj->outbytes = digest_length;
			obj->any_blake2_update = BLAKE_FN_CAST(blake2bp_update);
			obj->any_blake2_final = BLAKE_FN_CAST(blake2bp_final);
			obj->initialized_ = true;
		} else if (algo == "blake2s") {
			if (digest_length == -1) {
				digest_length = BLAKE2S_OUTBYTES;
			} else if (digest_length < 1 || digest_length > BLAKE2S_OUTBYTES) {
				return Nan::ThrowError("digestLength must be between 1 and 32");
			}

			if (!key_data) {
				if (blake2s_init(reinterpret_cast<blake2s_state*>(&obj->state), digest_length) != 0) {
					return Nan::ThrowError("blake2bs_init failure");
				}
			} else {
				if (key_length > BLAKE2S_KEYBYTES) {
					return Nan::ThrowError("Key must be 32 bytes or smaller");
				}
				if (blake2s_init_key(reinterpret_cast<blake2s_state*>(&obj->state), digest_length, key_data, key_length) != 0) {
					return Nan::ThrowError("blake2s_init_key failure");
				}
			}
			obj->outbytes = digest_length;
			obj->any_blake2_update = BLAKE_FN_CAST(blake2s_update);
			obj->any_blake2_final = BLAKE_FN_CAST(blake2s_final);
			obj->initialized_ = true;
		} else if (algo == "blake2sp") {
			if (digest_length == -1) {
				digest_length = BLAKE2S_OUTBYTES;
			} else if (digest_length < 1 || digest_length > BLAKE2S_OUTBYTES) {
				return Nan::ThrowError("digestLength must be between 1 and 32");
			}

			if (!key_data) {
				if (blake2sp_init(reinterpret_cast<blake2sp_state*>(&obj->state), digest_length) != 0) {
					return Nan::ThrowError("blake2sp_init failure");
				}
			} else {
				if (key_length > BLAKE2S_KEYBYTES) {
					return Nan::ThrowError("Key must be 32 bytes or smaller");
				}
				if (blake2sp_init_key(reinterpret_cast<blake2sp_state*>(&obj->state), digest_length, key_data, key_length) != 0) {
					return Nan::ThrowError("blake2sp_init_key failure");
				}
			}
			obj->outbytes = digest_length;
			obj->any_blake2_update = BLAKE_FN_CAST(blake2sp_update);
			obj->any_blake2_final = BLAKE_FN_CAST(blake2sp_final);
			obj->initialized_ = true;
		} else {
			return Nan::ThrowError("Algorithm must be blake2b, blake2s, blake2bp, or blake2sp");
		}
		info.GetReturnValue().Set(info.This());
	}

	static
	NAN_METHOD(Update) {
		Hash *obj = Nan::ObjectWrap::Unwrap<Hash>(info.This());

		if (!obj->initialized_) {
			v8::Local<v8::Value> exception = v8::Exception::Error(Nan::New<v8::String>("Not initialized").ToLocalChecked());
			return Nan::ThrowError(exception);
		}

		if (info.Length() < 1 || !node::Buffer::HasInstance(info[0])) {
			return Nan::ThrowError(v8::Exception::TypeError(Nan::New<v8::String>("Bad argument; need a Buffer").ToLocalChecked()));
		}

		v8::Local<v8::Object> buffer_obj = info[0]->ToObject(Nan::GetCurrentContext()).ToLocalChecked();
		const char *buffer_data = node::Buffer::Data(buffer_obj);
		size_t buffer_length = node::Buffer::Length(buffer_obj);
		obj->any_blake2_update(
			reinterpret_cast<void*>(&obj->state),
			reinterpret_cast<const uint8_t*>(buffer_data),
			buffer_length
		);

		info.GetReturnValue().Set(info.This());
	}

	static
	NAN_METHOD(Digest) {
		Hash *obj = Nan::ObjectWrap::Unwrap<Hash>(info.This());
		unsigned char digest[512 / 8];

		if (!obj->initialized_) {
			v8::Local<v8::Value> exception = v8::Exception::Error(Nan::New<v8::String>("Not initialized").ToLocalChecked());
			return Nan::ThrowError(exception);
		}

		obj->initialized_ = false;
		if (obj->any_blake2_final(reinterpret_cast<void*>(&obj->state), digest, obj->outbytes) != 0) {
			return Nan::ThrowError("blake2*_final failure");
		}

		v8::Local<v8::Value> rc = Nan::Encode(
			reinterpret_cast<const char*>(digest),
			obj->outbytes,
			Nan::BUFFER
		);

		info.GetReturnValue().Set(rc);
	}

	static
	NAN_METHOD(Copy) {
		Hash *src = Nan::ObjectWrap::Unwrap<Hash>(info.This());

		const unsigned argc = 1;
		v8::Local<v8::Value> argv[argc] = { Nan::New<v8::String>("bypass").ToLocalChecked() };

		v8::Local<v8::FunctionTemplate> tmpl = Nan::New<v8::FunctionTemplate>(hash_constructor);
		Nan::MaybeLocal<v8::Function> construct = Nan::GetFunction(tmpl);
		v8::Local<v8::Object> inst = Nan::NewInstance(construct.ToLocalChecked(), argc, argv).ToLocalChecked();
		// Construction may fail with a JS exception, in which case we just need
		// to return.
		if (inst.IsEmpty()) {
			return;
		}
		Hash *dest = new Hash();
		dest->Wrap(inst);

		dest->initialized_ = src->initialized_;
		dest->any_blake2_update = src->any_blake2_update;
		dest->any_blake2_final = src->any_blake2_final;
		dest->outbytes = src->outbytes;
		dest->state = src->state;

		info.GetReturnValue().Set(inst);
	}
};

static void
init(v8::Local<v8::Object> target) {
	Hash::Init(target);
}

NODE_MODULE(binding, init)
