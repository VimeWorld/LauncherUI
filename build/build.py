# -*- coding: utf-8 -*-
""" Скрипт для сборки проекта в один архив """

import os
import re
from codecs import open
from subprocess import Popen
from zipfile import ZipFile, ZIP_DEFLATED

os.chdir('../')

def zipdir(path, ziph):
    for root, dirs, files in os.walk(os.path.join(path)):
        for file in files:
            ziph.write(os.path.join(root, file), os.path.join(root, file))

def minify_js(files, out):
    with open('temp.js', 'w', 'utf-8') as tempfile:
        for fname in files:
            with open(fname, 'r', 'utf-8') as infile:
                tempfile.write(infile.read())
    Popen(('java -jar build/yuicompressor-2.4.8.jar --type js -o '+out+' --charset utf-8 temp.js').split(' ')).communicate()
    os.remove('temp.js')


print ('Writing resources')
zipf = ZipFile('build/html.zip', 'w', ZIP_DEFLATED)
zipdir('css', zipf)
zipdir('img', zipf)
zipdir('fonts', zipf)

#Поиск всех подключаемых скриптов и их минимизация (с заменой в html файле)
print ('Minimizing js files:')
jslist = []
with open('index.html0', 'w', 'utf-8') as outfile:
	with open('index.html', 'r', 'utf-8') as infile:
		for line in infile.read().split('\r\n'):
			if line.startswith('\t<script src="js/'):
				found = re.match('^.*src=\"(.*)\".*$', line).group(1)
				jslist.append(found)
				print('    '+found)
			else:
				if line == '</head>':
					outfile.write('\t<script src="js/vimeworld.min.js"></script>\r\n');
				outfile.write(line+'\r\n')
minify_js(jslist, 'js/vimeworld.min.js')

zipf.write('js/vimeworld.min.js')
zipf.write('js/libs/smooth-scroll.min.js')
zipf.write('index.html0', 'index.html')
zipf.close()

#Удаление ненужных файлов
os.remove('js/vimeworld.min.js')
os.remove('index.html0')
