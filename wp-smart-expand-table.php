<?php
/*
Plugin Name: Smart Expand Tables for WordPress
Plugin URI: http://URI_Of_Page_Describing_Plugin_and_Updates
Description: A brief description of the Plugin.
Version: 0.6.0
Author: Neuron Q
Author URI: http://URI_Of_The_Plugin_Author
License: BSD
*/

require_once dirname(__FILE__) . '/markdown.php';

function xtable_enqueue_backend_jscss() {
	
	wp_enqueue_style( 'jquery-smart-expand-table',
		plugins_url( 'jquery-smart-expand-table/jquery-smart-expand-table.css', __FILE__ ) );

	wp_enqueue_script( 'jquery-smart-expand-table',
		plugins_url( 'jquery-smart-expand-table/jquery-smart-expand-table.js', __FILE__ ),
		array( 'jquery' ) );
}
add_action('wp_enqueue_scripts', 'xtable_enqueue_backend_jscss');

function xtable_shortcode_handler( $atts, $content = null) {

	bk_debug_krumo('handling');
	bk_debug_krumo($content, '$content');

	if ( ! $content ) return '';

	if ( empty( $atts['id'] ) ) {
		$atts['id'] = 'smartx-table-' . uniqid();
	}

	extract( shortcode_atts( array(
		'id' => null,
		'options' => 'null',
		), $atts ) );

	$html = Markdown( $content );

	bk_debug_krumo($html, '$html');

	$patterns = array(
		'/(<table[^>]*)(class="([^"]*)")?([^>]*>)/',
		'/<th([^>]*)>(.*)\{(\d+)\}\s*(\*)*\s*<\/th>/',
		'/<th([^>]*)>(.*)\*\s*(\{\d+\})?\s*<\/th>/',
	);

	$replacements = array(
		'$1 class="$2 smartx-table table table-bordered"$4',
		'<th $1 data-smartx-table-maxlen="$3">$2$4</th>',
		'<th $1 data-smartx-table-hidden="true">$2$3</th>',
	);

	$html = preg_replace( $patterns, $replacements, $html );

	bk_debug_krumo($html, '$html replaced');

	$html .= <<<EOS
<script>
jQuery(document).ready(function ($) {

	$('table.smartx-table').smartExpandTable($options);

});
</script>
EOS;

	return $html;
}
add_shortcode( 'xtable', 'xtable_shortcode_handler' );
