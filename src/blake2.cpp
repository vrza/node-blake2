#include <node.h>
#include <node_buffer.h>
#include <v8.h>
#include <nan.h>
#include <cstddef>
#include <cassert>
#include <cstring>

#include "blake2.h"

#define THROW_AND_RETURN_IF_NOT_STRING_OR_BUFFER(val) \
	if (!val->IsString() && !Buffer::HasInstance(val)) { \
		return NanThrowError(Exception::TypeError(NanNew<String>("Not a string or buffer"))); \
	}

using namespace node;
using namespace v8;

class BLAKE2Hash: public ObjectWrap {
protected:
	bool initialised_;

public:
	blake2b_state state;

	static void
	Initialize(Handle<Object> target) {
		NanScope();
		Local<FunctionTemplate> t = NanNew<FunctionTemplate>(New);
		t->InstanceTemplate()->SetInternalFieldCount(1);
		t->SetClassName(NanNew<String>("BLAKE2Hash"));

		NODE_SET_PROTOTYPE_METHOD(t, "update", Update);
		NODE_SET_PROTOTYPE_METHOD(t, "digest", Digest);

		NanAssignPersistent(constructor, t->GetFunction());
		target->Set(NanNew<String>("BLAKE2Hash"), t->GetFunction());
	}

	static
	NAN_METHOD(New) {
		NanScope();
		BLAKE2Hash *obj;

		if (!args.IsConstructCall()) {
			return NanThrowError("Constructor must be called with new");
		}

		// Invoked as constructor.
		obj = new BLAKE2Hash();
		obj->Wrap(args.This());
		if(args.Length() < 1) {
			return NanThrowError(Exception::TypeError(NanNew<String>("Expected a string argument with algorithm name")));
		}
		if(!args[0]->IsString()) {
			return NanThrowError(Exception::TypeError(NanNew<String>("Algorithm name must be a string")));
		}
		std::string algo = std::string(*(String::Utf8Value(args[0]->ToString())));
		if(algo != "blake2b") {
			return NanThrowError("Algorithm must be blake2b");
		}
		obj->initialised_ = true;
		blake2b_init(&obj->state, BLAKE2B_OUTBYTES);
		NanReturnValue(args.This());
	}

	static
	NAN_METHOD(Update) {
		NanScope();
		BLAKE2Hash *obj = ObjectWrap::Unwrap<BLAKE2Hash>(args.This());

		THROW_AND_RETURN_IF_NOT_STRING_OR_BUFFER(args[0]);

		if(!obj->initialised_) {
			Local<Value> exception = Exception::Error(NanNew<String>("Not initialized"));
			return NanThrowError(exception);
		}

		enum encoding enc = ParseEncoding(args[1]);
		ssize_t len = DecodeBytes(args[0], enc);

		if (len < 0) {
			Local<Value> exception = Exception::Error(NanNew<String>("Bad argument"));
			return NanThrowError(exception);
		}

		if (Buffer::HasInstance(args[0])) {
			Local<Object> buffer_obj = args[0]->ToObject();
			const char *buffer_data = Buffer::Data(buffer_obj);
			size_t buffer_length = Buffer::Length(buffer_obj);
			blake2b_update(&obj->state, (uint8_t *) buffer_data, buffer_length);
		} else {
			char *buf = new char[len];
			ssize_t written = DecodeWrite(buf, len, args[0], enc);
			assert(written == len);
			blake2b_update(&obj->state, (uint8_t *) buf, len);
			delete[] buf;
		}

		NanReturnValue(args.This());
	}

	static
	NAN_METHOD(Digest) {
		NanScope();
		v8::Isolate* isolate = v8::Isolate::GetCurrent();
		BLAKE2Hash *obj = ObjectWrap::Unwrap<BLAKE2Hash>(args.This());
		unsigned char digest[512 / 8];

		if(!obj->initialised_) {
			Local<Value> exception = Exception::Error(NanNew<String>("Not initialized"));
			return NanThrowError(exception);
		}

		obj->initialised_ = false;
		blake2b_final(&obj->state, digest, BLAKE2B_OUTBYTES);

		Local<Value> outString;

		enum encoding encoding = BUFFER;
		if (args.Length() >= 1) {
			// TODO: make compatible with pre-iojs nodes
			// https://github.com/iojs/nan/issues/189
			encoding = ParseEncoding(
				isolate,
				args[0]->ToString(isolate),
				BUFFER
			);
		}

		// TODO: make compatible with pre-iojs nodes
		// Need to convert node::Encoding to Nan::Encoding?
		Local<Value> rc = Encode(
			isolate,
			reinterpret_cast<const char*>(digest),
			512 / 8,
			encoding
		);

		NanReturnValue(rc);
	}

private:
	static Persistent<Function> constructor;
};

Persistent<Function> BLAKE2Hash::constructor;

static void
init(Handle<Object> target) {
	BLAKE2Hash::Initialize(target);
}

NODE_MODULE(blake2, init)
