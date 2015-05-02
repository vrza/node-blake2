#include <node.h>
#include <node_buffer.h>
#include <v8.h>
#include <nan.h>
#include <cstddef>
#include <cassert>
#include <cstring>

#include "blake2.h"

#define MAX_DIGEST_SIZE 64
#define THROW_AND_RETURN_IF_NOT_STRING_OR_BUFFER(val) \
	if (!val->IsString() && !Buffer::HasInstance(val)) { \
		return NanThrowError(Exception::TypeError(NanNew<String>("Not a string or buffer"))); \
	}

using namespace node;
using namespace v8;

static void toHex(const char *data_buf, size_t size, char *output);

class BLAKE2bHash: public ObjectWrap {
private:
	bool initialised_;

public:
	blake2b_state state;

	static void
	Initialize(Handle<Object> target) {
		NanScope();
		Local<FunctionTemplate> t = NanNew<FunctionTemplate>(New);
		t->InstanceTemplate()->SetInternalFieldCount(1);
		t->SetClassName(NanNew<String>("BLAKE2bHash"));

		NODE_SET_PROTOTYPE_METHOD(t, "update", Update);
		NODE_SET_PROTOTYPE_METHOD(t, "digest", Digest);

		NanAssignPersistent(constructor, t->GetFunction());
		target->Set(NanNew<String>("BLAKE2bHash"), t->GetFunction());
	}

	static
	NAN_METHOD(New) {
		NanScope();
		BLAKE2bHash *obj;

		if (args.IsConstructCall()) {
			// Invoked as constructor.
			obj = new BLAKE2bHash();
			obj->Wrap(args.This());
			obj->initialised_ = true;
			blake2b_init(&obj->state, BLAKE2B_OUTBYTES);
			NanReturnValue(args.This());
		} else {
			// Invoked as a plain function.
			Local<Function> cons = NanNew<Function>(constructor);
			NanReturnValue(cons->NewInstance());
		}
	}

	static
	NAN_METHOD(Update) {
		NanScope();
		BLAKE2bHash *obj = ObjectWrap::Unwrap<BLAKE2bHash>(args.This());

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
		BLAKE2bHash *obj = ObjectWrap::Unwrap<BLAKE2bHash>(args.This());
		unsigned char digest[MAX_DIGEST_SIZE];

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

Persistent<Function> BLAKE2bHash::constructor;

static const char hex_chars[] = {
	'0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
	'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j',
	'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't',
	'u', 'v', 'w', 'x', 'y', 'z'
};

static void
toHex(const char *data_buf, size_t size, char *output) {
	size_t i;

	for (i = 0; i < size; i++) {
		output[i * 2] = hex_chars[(unsigned char) data_buf[i] / 16];
		output[i * 2 + 1] = hex_chars[(unsigned char) data_buf[i] % 16];
	}
}

static void
init(Handle<Object> target) {
	BLAKE2bHash::Initialize(target);
}

NODE_MODULE(blake2, init)
