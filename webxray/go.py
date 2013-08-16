from wsgiref.simple_server import make_server
from wsgiref.util import FileWrapper
import os
import sys
import shutil
import glob
import time
import mimetypes

try:
    import json
except ImportError:
    import simplejson as json

ROOT = os.path.abspath(os.path.dirname(__file__))
JS_TYPE = 'application/javascript; charset=utf-8'

path = lambda *x: os.path.join(ROOT, *x)
locale_dir = path('locale')
locale_domain = 'webxray'

sys.path.append(path('vendor'))

import argparse
import localization

def get_git_commit():
    try:
        head = open(path('.git', 'HEAD'), 'r').read()
        if head.startswith('ref: '):
            ref = open(path('.git', head.split()[1].strip()), 'r').read()
            return ref.strip()
        return head.strip()
    except Exception:
        return "unknown"

def build_compiled_file(cfg):
    metadata = json.dumps(dict(commit=get_git_commit(),
                               date=time.ctime()))
    contents = []
    for path in cfg['compiledFileParts']:
        if '.local.' in path:
            if not os.path.exists(path):
                continue
        if '*' in path:
            filenames = glob.glob(path)
        else:
            filenames = [path]
        for filename in filenames:
            data = open(filename, 'r').read()
            data = data.replace('__BUILD_METADATA__', metadata)
            contents.append(data)
    return ''.join(contents)

def make_app(cfg):
    def app(environ, start_response):
        path = environ['PATH_INFO']

        if path == cfg['compiledFile']:
            compiled = build_compiled_file(cfg)
            start_response('200 OK',
                           [('Content-Type', JS_TYPE),
                            ('Content-Length', str(len(compiled)))])
            return [compiled]
        
        if path.endswith('/'):
            path = '%sindex.html' % path
        fileparts = path[1:].split('/')
        fullpath = os.path.join(ROOT, cfg['staticFilesDir'], *fileparts)
        fullpath = os.path.normpath(fullpath)
        (mimetype, encoding) = mimetypes.guess_type(fullpath)
        if (fullpath.startswith(ROOT) and
            not '.git' in fullpath and
            os.path.isfile(fullpath) and
            mimetype):
            filesize = os.stat(fullpath).st_size
            start_response('200 OK', [('Content-Type', mimetype),
                                      ('Content-Length', str(filesize))])
            return FileWrapper(open(fullpath, 'rb'))

        start_response('404 Not Found', [('Content-Type', 'text/plain')])
        return ['Not Found: ', path]

    return app

def cmd_serve(args, cfg):
    "run development web server"
    
    cmd_compilemessages(args, cfg)
    ipstr = args.ip
    if not ipstr:
        ipstr = 'all IP interfaces'
    server = make_server(args.ip, args.port, make_app(cfg))
    print "serving on %s port %d" % (ipstr, args.port)
    server.serve_forever()

def cmd_serve_args(parser):
    parser.add_argument('--port', help='port to serve on',
                        type=int, default=8000)
    parser.add_argument('--ip', help='IP to bind to',
                        default='')

def cmd_compilemessages(args, cfg):
    "convert message files into binary and JS formats"

    localization.compilemessages(json_dir=path(cfg['staticFilesDir']),
                                 js_locale_dir=path('src', 'locale'),
                                 default_locale='en',
                                 locale_dir=locale_dir,
                                 locale_domain=locale_domain)

def cmd_makemessages(args, cfg):
    "create/update message file(s) for localization"
    
    localization.makemessages(babel_ini_file=path('babel.ini'),
                              json_dir=path(cfg['staticFilesDir']),
                              locale_dir=locale_dir,
                              locale_domain=locale_domain,
                              locale=args.locale)

def cmd_makemessages_args(parser):
    parser.add_argument('-l', '--locale', help='locale')

def cmd_compile(args, cfg):
    "generate compiled files"
    
    cmd_compilemessages(args, cfg)
    f = open(cfg['compiledFilename'], 'w')
    f.write(build_compiled_file(cfg))
    f.close()
    print "wrote %s" % cfg['compiledFilename']

def cmd_clean(args, cfg):
    "delete all generated files"

    if os.path.exists(cfg['compiledFilename']):
        print "removing %s" % cfg['compiledFilename']
        os.remove(cfg['compiledFilename'])
    for filename in glob.glob(path('src', 'locale', '*.js')):
        print "removing %s" % filename
        os.remove(filename)
    print "removed generated files."

def main():
    cfg = json.loads(open('config.json', 'r').read())
    cfg['compiledFilename'] = cfg['staticFilesDir'] + cfg['compiledFile']

    parser = argparse.ArgumentParser()
    subparsers = parser.add_subparsers()

    globs = globals()
    for name in globs:
        if name.startswith('cmd_') and not name.endswith('_args'):
            cmdfunc = globs[name]
            subparser = subparsers.add_parser(name[4:], help=cmdfunc.__doc__)
            subparser.set_defaults(func=cmdfunc)
            add_args = globs.get('%s_args' % name)
            if add_args:
                add_args(subparser)

    args = parser.parse_args()
    args.func(args, cfg)

if __name__ == "__main__":
    main()
